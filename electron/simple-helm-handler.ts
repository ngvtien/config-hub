import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import https from 'node:https'
import http from 'node:http'
import { URL } from 'node:url'
import { simpleCredentialManager, HelmCredential } from './simple-credential-manager'

const execAsync = promisify(exec)

// Helm configuration and operations
export interface HelmConfig {
  id?: string
  name: string
  registryUrl: string
  authType: 'userpass' | 'token' | 'cert'
  username?: string
  password?: string
  token?: string
  certFile?: string
  keyFile?: string
  caFile?: string
  insecureSkipTlsVerify?: boolean
  environment?: string
  tags?: string[]
}

export interface HelmRepository {
  id: string
  name: string
  url: string
  credentialId: string
  type: 'helm' | 'oci'
  lastSync?: string
  status?: 'active' | 'inactive' | 'error'
  charts?: HelmChart[]
}

export interface HelmChart {
  name: string
  version: string
  description?: string
  appVersion?: string
  created?: string
  digest?: string
}

class SimpleHelmCredentialManager {
  private helmConfigDir: string
  private certsDir: string

  constructor() {
    this.helmConfigDir = path.join(os.homedir(), '.config', 'helm')
    this.certsDir = path.join(this.helmConfigDir, 'certs')
    this.ensureDirectories()
  }

  private ensureDirectories(): void {
    try {
      if (!fs.existsSync(this.helmConfigDir)) {
        fs.mkdirSync(this.helmConfigDir, { recursive: true, mode: 0o755 })
      }
      if (!fs.existsSync(this.certsDir)) {
        fs.mkdirSync(this.certsDir, { recursive: true, mode: 0o755 })
      }
    } catch (error) {
      console.error('Failed to create Helm directories:', error)
    }
  }

  // Store Helm credential
  async storeHelmCredential(config: HelmConfig): Promise<string> {
    try {
      const credentialId = config.id || simpleCredentialManager.generateCredentialId('helm', config.registryUrl)
      
      const credential: HelmCredential = {
        id: credentialId,
        name: config.name,
        type: 'helm',
        registryUrl: config.registryUrl,
        authType: config.authType,
        username: config.username,
        password: config.password,
        token: config.token,
        certFile: config.certFile,
        keyFile: config.keyFile,
        caFile: config.caFile,
        insecureSkipTlsVerify: config.insecureSkipTlsVerify,
        environment: config.environment,
        tags: config.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await simpleCredentialManager.storeCredential(credential)

      // If certificate-based auth, store cert files
      if (config.authType === 'cert' && (config.certFile || config.keyFile || config.caFile)) {
        await this.setupCertificates(credentialId, config.certFile, config.keyFile, config.caFile)
      }

      return credentialId
    } catch (error) {
      console.error('Failed to store Helm credential:', error)
      throw error
    }
  }

  // Setup certificates for Helm usage
  private async setupCertificates(credentialId: string, certFile?: string, keyFile?: string, caFile?: string): Promise<void> {
    try {
      const credentialCertDir = path.join(this.certsDir, credentialId)
      if (!fs.existsSync(credentialCertDir)) {
        fs.mkdirSync(credentialCertDir, { mode: 0o755 })
      }

      if (certFile) {
        const certPath = path.join(credentialCertDir, 'client.crt')
        fs.writeFileSync(certPath, certFile, { mode: 0o644 })
      }

      if (keyFile) {
        const keyPath = path.join(credentialCertDir, 'client.key')
        fs.writeFileSync(keyPath, keyFile, { mode: 0o600 })
      }

      if (caFile) {
        const caPath = path.join(credentialCertDir, 'ca.crt')
        fs.writeFileSync(caPath, caFile, { mode: 0o644 })
      }
    } catch (error) {
      console.error('Failed to setup certificates:', error)
      throw error
    }
  }

  // Simple HTTP request helper
  private makeHttpRequest(url: string, options: any = {}): Promise<{ statusCode: number; data: string }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url)
      const isHttps = urlObj.protocol === 'https:'
      const client = isHttps ? https : http

      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: options.timeout || 10000,
        rejectUnauthorized: !options.insecureSkipTlsVerify
      }

      if (options.auth) {
        const auth = Buffer.from(`${options.auth.username}:${options.auth.password}`).toString('base64')
        requestOptions.headers['Authorization'] = `Basic ${auth}`
      }

      const req = client.request(requestOptions, (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 0, data })
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    })
  }

  // Test Helm credential
  async testHelmCredential(credentialId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as HelmCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      // Determine if it's an OCI registry or traditional Helm repository
      const isOCI = credential.registryUrl.includes('oci://') || 
                   credential.registryUrl.includes('docker.io') ||
                   credential.registryUrl.includes('ghcr.io') ||
                   credential.registryUrl.includes('gcr.io') ||
                   credential.registryUrl.includes('ecr')

      if (isOCI) {
        return await this.testOCIRegistry(credential)
      } else {
        return await this.testHelmRepository(credential)
      }
    } catch (error) {
      console.error('Failed to test Helm credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async testOCIRegistry(credential: HelmCredential): Promise<{ success: boolean; error?: string }> {
    try {
      // For OCI registries, test by attempting to login with helm
      let loginCommand = ''
      const registryUrl = credential.registryUrl.replace('oci://', '').split('/')[0]

      switch (credential.authType) {
        case 'userpass':
          if (!credential.username || !credential.password) {
            return { success: false, error: 'Username or password not found' }
          }
          loginCommand = `echo "${credential.password}" | helm registry login ${registryUrl} --username "${credential.username}" --password-stdin`
          break

        case 'token':
          if (!credential.token) {
            return { success: false, error: 'Token not found' }
          }
          const username = credential.username || 'oauth2accesstoken'
          loginCommand = `echo "${credential.token}" | helm registry login ${registryUrl} --username "${username}" --password-stdin`
          break

        case 'cert':
          const certDir = path.join(this.certsDir, credential.id)
          const certFile = path.join(certDir, 'client.crt')
          const keyFile = path.join(certDir, 'client.key')
          const caFile = path.join(certDir, 'ca.crt')
          
          let certFlags = ''
          if (fs.existsSync(certFile)) certFlags += ` --cert-file "${certFile}"`
          if (fs.existsSync(keyFile)) certFlags += ` --key-file "${keyFile}"`
          if (fs.existsSync(caFile)) certFlags += ` --ca-file "${caFile}"`
          
          loginCommand = `helm registry login ${registryUrl}${certFlags}`
          break

        default:
          return { success: false, error: 'Unsupported auth type for OCI registry' }
      }

      const { stdout, stderr } = await execAsync(loginCommand)
      const output = stdout + stderr

      if (output.includes('Login Succeeded') || output.includes('login succeeded')) {
        return { success: true }
      } else {
        return { success: false, error: `OCI registry login failed: ${output}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'OCI registry test failed' }
    }
  }

  private async testHelmRepository(credential: HelmCredential): Promise<{ success: boolean; error?: string }> {
    try {
      // For traditional Helm repositories, test by making HTTP request to index.yaml
      const indexUrl = `${credential.registryUrl.replace(/\/$/, '')}/index.yaml`
      
      const requestOptions: any = {
        timeout: 10000,
        insecureSkipTlsVerify: credential.insecureSkipTlsVerify
      }

      // Setup authentication
      switch (credential.authType) {
        case 'userpass':
          if (credential.username && credential.password) {
            requestOptions.auth = {
              username: credential.username,
              password: credential.password
            }
          }
          break

        case 'token':
          if (credential.token) {
            requestOptions.headers = {
              'Authorization': `Bearer ${credential.token}`
            }
          }
          break

        case 'cert':
          // Certificate authentication would require more complex setup
          // For now, just test basic connectivity
          break
      }

      const response = await this.makeHttpRequest(indexUrl, requestOptions)
      
      if (response.statusCode === 200 && response.data.includes('apiVersion')) {
        return { success: true }
      } else if (response.statusCode === 401) {
        return { success: false, error: 'Authentication failed - invalid credentials' }
      } else if (response.statusCode === 403) {
        return { success: false, error: 'Access forbidden - insufficient permissions' }
      } else {
        return { success: false, error: `Unexpected response: ${response.statusCode}` }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('ENOTFOUND')) {
          return { success: false, error: 'Repository URL not found' }
        }
      }
      return { success: false, error: error instanceof Error ? error.message : 'Repository test failed' }
    }
  }

  // Add Helm repository using stored credentials
  async addHelmRepository(credentialId: string, repoName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as HelmCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      let addCommand = `helm repo add "${repoName}" "${credential.registryUrl}"`

      // Add authentication flags
      switch (credential.authType) {
        case 'userpass':
          if (credential.username && credential.password) {
            addCommand += ` --username "${credential.username}" --password "${credential.password}"`
          }
          break

        case 'token':
          if (credential.token) {
            addCommand += ` --password "${credential.token}"`
            if (credential.username) {
              addCommand += ` --username "${credential.username}"`
            }
          }
          break

        case 'cert':
          const certDir = path.join(this.certsDir, credential.id)
          const certFile = path.join(certDir, 'client.crt')
          const keyFile = path.join(certDir, 'client.key')
          const caFile = path.join(certDir, 'ca.crt')
          
          if (fs.existsSync(certFile)) addCommand += ` --cert-file "${certFile}"`
          if (fs.existsSync(keyFile)) addCommand += ` --key-file "${keyFile}"`
          if (fs.existsSync(caFile)) addCommand += ` --ca-file "${caFile}"`
          break
      }

      if (credential.insecureSkipTlsVerify) {
        addCommand += ' --insecure-skip-tls-verify'
      }

      const { stdout, stderr } = await execAsync(addCommand)
      const output = stdout + stderr

      if (output.includes('has been added to your repositories')) {
        // Update repository index
        await execAsync(`helm repo update "${repoName}"`)
        return { success: true }
      } else {
        return { success: false, error: `Failed to add repository: ${output}` }
      }
    } catch (error) {
      console.error('Failed to add Helm repository:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // List charts in a Helm repository
  async listCharts(credentialId: string, repoName?: string): Promise<{ success: boolean; data?: HelmChart[]; error?: string }> {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId) as HelmCredential
      if (!credential) {
        return { success: false, error: 'Credential not found' }
      }

      // If no repo name provided, use credential name
      const repositoryName = repoName || credential.name

      // Search for charts in the repository
      const { stdout } = await execAsync(`helm search repo "${repositoryName}/" --output json`)
      const charts = JSON.parse(stdout)

      const helmCharts: HelmChart[] = charts.map((chart: any) => ({
        name: chart.name,
        version: chart.version,
        description: chart.description,
        appVersion: chart.app_version
      }))

      return { success: true, data: helmCharts }
    } catch (error) {
      console.error('Failed to list Helm charts:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Clean up certificates when credential is deleted
  async cleanupCertificates(credentialId: string): Promise<void> {
    try {
      const credentialCertDir = path.join(this.certsDir, credentialId)
      if (fs.existsSync(credentialCertDir)) {
        fs.rmSync(credentialCertDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.error('Failed to cleanup certificates:', error)
    }
  }
}

// Initialize Helm credential manager
const simpleHelmCredentialManager = new SimpleHelmCredentialManager()

// IPC Handlers for Helm operations
export function setupSimpleHelmHandlers(): void {
  // Store Helm credentials
  ipcMain.handle('helm:store-credential', async (_, config: HelmConfig) => {
    try {
      const credentialId = await simpleHelmCredentialManager.storeHelmCredential(config)
      return { success: true, credentialId }
    } catch (error) {
      console.error('Failed to store Helm credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test Helm credential
  ipcMain.handle('helm:test-credential', async (_, credentialId: string) => {
    try {
      return await simpleHelmCredentialManager.testHelmCredential(credentialId)
    } catch (error) {
      console.error('Failed to test Helm credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List Helm credentials
  ipcMain.handle('helm:list-credentials', async (_, environment?: string) => {
    try {
      const credentials = await simpleCredentialManager.listCredentials('helm', environment)
      return { success: true, data: credentials }
    } catch (error) {
      console.error('Failed to list Helm credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Get Helm credential
  ipcMain.handle('helm:get-credential', async (_, credentialId: string) => {
    try {
      const credential = await simpleCredentialManager.getCredential(credentialId)
      return { success: true, data: credential }
    } catch (error) {
      console.error('Failed to get Helm credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Delete Helm credential
  ipcMain.handle('helm:delete-credential', async (_, credentialId: string) => {
    try {
      await simpleHelmCredentialManager.cleanupCertificates(credentialId)
      const success = await simpleCredentialManager.deleteCredential(credentialId)
      return { success }
    } catch (error) {
      console.error('Failed to delete Helm credential:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Add Helm repository
  ipcMain.handle('helm:add-repository', async (_, credentialId: string, repoName: string) => {
    try {
      return await simpleHelmCredentialManager.addHelmRepository(credentialId, repoName)
    } catch (error) {
      console.error('Failed to add Helm repository:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // List charts in repository
  ipcMain.handle('helm:list-charts', async (_, credentialId: string, repoName?: string) => {
    try {
      return await simpleHelmCredentialManager.listCharts(credentialId, repoName)
    } catch (error) {
      console.error('Failed to list Helm charts:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Find Helm credentials by registry URL
  ipcMain.handle('helm:find-credentials-by-registry', async (_, registryUrl: string) => {
    try {
      const credentials = await simpleCredentialManager.findCredentials({ type: 'helm', registryUrl })
      return { success: true, data: credentials }
    } catch (error) {
      console.error('Failed to find Helm credentials:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })
}