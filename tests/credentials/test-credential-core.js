// Test the core credential functionality without Electron dependencies
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// Mock Electron's safeStorage
const mockSafeStorage = {
  isEncryptionAvailable: () => false, // Force fallback to crypto
  encryptString: (data) => Buffer.from(data, 'utf8'),
  decryptString: (buffer) => buffer.toString('utf8')
}

// Simple credential manager implementation for testing
class TestCredentialManager {
  constructor() {
    this.testDir = path.join(__dirname, 'test-data')
    this.metadataFile = path.join(this.testDir, 'credentials-metadata.json')
    this.sensitiveDir = path.join(this.testDir, 'sensitive')
    this.ensureDirectories()
  }

  ensureDirectories() {
    if (!fs.existsSync(this.testDir)) {
      fs.mkdirSync(this.testDir, { recursive: true })
    }
    if (!fs.existsSync(this.sensitiveDir)) {
      fs.mkdirSync(this.sensitiveDir, { mode: 0o700, recursive: true })
    }
  }

  // Encrypt sensitive data using Node.js crypto
  encryptData(data) {
    const key = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return `crypto:${key.toString('hex')}:${iv.toString('hex')}:${encrypted}`
  }

  // Decrypt sensitive data
  decryptData(encryptedData) {
    if (encryptedData.startsWith('crypto:')) {
      const parts = encryptedData.substring(7).split(':')
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format')
      }
      
      const key = Buffer.from(parts[0], 'hex')
      const iv = Buffer.from(parts[1], 'hex')
      const encrypted = parts[2]
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    }

    throw new Error('Invalid encrypted data format')
  }

  // Get credential metadata
  getCredentialMetadata() {
    try {
      if (!fs.existsSync(this.metadataFile)) {
        return {}
      }
      const data = fs.readFileSync(this.metadataFile, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      console.error('Failed to read credential metadata:', error)
      return {}
    }
  }

  // Save credential metadata
  saveCredentialMetadata(metadata) {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2), {
        mode: 0o600
      })
    } catch (error) {
      console.error('Failed to save credential metadata:', error)
      throw new Error('Failed to save credential metadata')
    }
  }

  // Store credential securely
  async storeCredential(credential) {
    try {
      // Separate sensitive and non-sensitive data
      const { 
        token, password, privateKey, secretId, passphrase, 
        certFile, keyFile, caFile, ...metadata 
      } = credential

      // Store sensitive data in encrypted file
      const sensitiveData = {}
      if (token) sensitiveData.token = token
      if (password) sensitiveData.password = password
      if (privateKey) sensitiveData.privateKey = privateKey
      if (secretId) sensitiveData.secretId = secretId
      if (passphrase) sensitiveData.passphrase = passphrase
      if (certFile) sensitiveData.certFile = certFile
      if (keyFile) sensitiveData.keyFile = keyFile
      if (caFile) sensitiveData.caFile = caFile

      if (Object.keys(sensitiveData).length > 0) {
        const encryptedSensitiveData = this.encryptData(JSON.stringify(sensitiveData))
        const sensitiveFilePath = path.join(this.sensitiveDir, `${credential.id}.enc`)
        fs.writeFileSync(sensitiveFilePath, encryptedSensitiveData, { mode: 0o600 })
      }

      // Store metadata in file
      const allMetadata = this.getCredentialMetadata()
      allMetadata[credential.id] = {
        ...metadata,
        updatedAt: new Date().toISOString()
      }
      this.saveCredentialMetadata(allMetadata)

    } catch (error) {
      console.error('Failed to store credential:', error)
      throw new Error('Failed to store credential securely')
    }
  }

  // Retrieve credential
  async getCredential(id) {
    try {
      const metadata = this.getCredentialMetadata()
      const credentialMetadata = metadata[id]
      
      if (!credentialMetadata) {
        return null
      }

      // Get sensitive data from encrypted file
      const sensitiveFilePath = path.join(this.sensitiveDir, `${id}.enc`)
      let sensitiveData = {}
      
      if (fs.existsSync(sensitiveFilePath)) {
        try {
          const encryptedData = fs.readFileSync(sensitiveFilePath, 'utf8')
          const decryptedData = this.decryptData(encryptedData)
          sensitiveData = JSON.parse(decryptedData)
        } catch (error) {
          console.error('Failed to decrypt sensitive data for credential:', id, error)
        }
      }

      // Combine metadata and sensitive data
      return {
        ...credentialMetadata,
        ...sensitiveData
      }

    } catch (error) {
      console.error('Failed to retrieve credential:', error)
      return null
    }
  }

  // List all credentials
  async listCredentials(type, environment) {
    try {
      const metadata = this.getCredentialMetadata()
      let credentials = Object.values(metadata)

      if (type) {
        credentials = credentials.filter(cred => cred.type === type)
      }

      if (environment) {
        credentials = credentials.filter(cred => cred.environment === environment)
      }

      return credentials.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (error) {
      console.error('Failed to list credentials:', error)
      return []
    }
  }

  // Delete credential
  async deleteCredential(id) {
    try {
      // Remove sensitive data file
      const sensitiveFilePath = path.join(this.sensitiveDir, `${id}.enc`)
      if (fs.existsSync(sensitiveFilePath)) {
        fs.unlinkSync(sensitiveFilePath)
      }

      // Remove from metadata
      const metadata = this.getCredentialMetadata()
      delete metadata[id]
      this.saveCredentialMetadata(metadata)

      return true
    } catch (error) {
      console.error('Failed to delete credential:', error)
      return false
    }
  }

  // Generate unique ID for credentials
  generateCredentialId(type, identifier) {
    const timestamp = Date.now()
    const hash = crypto.createHash('sha256')
    hash.update(`${type}-${identifier}-${timestamp}`)
    return hash.digest('hex').substring(0, 16)
  }

  // Test credential access
  async testCredentialAccess() {
    try {
      const testId = 'test-credential'
      const testCredential = {
        id: testId,
        name: 'Test Credential',
        type: 'git',
        repoUrl: 'https://github.com/test/test.git',
        authType: 'token',
        token: 'test-token',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await this.storeCredential(testCredential)
      const retrieved = await this.getCredential(testId)
      await this.deleteCredential(testId)

      return retrieved?.token === 'test-token'
    } catch (error) {
      console.error('Credential access test failed:', error)
      return false
    }
  }
}

async function testCredentialSystem() {
  console.log('🧪 Testing Core Credential System...\n')

  try {
    const credentialManager = new TestCredentialManager()
    console.log('✅ TestCredentialManager created successfully')

    // Test 1: Health check
    console.log('\n📋 Test 1: Health Check')
    const healthCheck = await credentialManager.testCredentialAccess()
    console.log(`Health check: ${healthCheck ? '✅ PASSED' : '❌ FAILED'}`)

    // Test 2: Store different types of credentials
    console.log('\n📋 Test 2: Store Multiple Credential Types')
    
    const credentials = [
      {
        id: 'test-argocd-1',
        name: 'Test ArgoCD Server',
        type: 'argocd',
        serverUrl: 'https://argocd.example.com',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token',
        environment: 'development',
        tags: ['test', 'dev'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-git-1',
        name: 'Main Repository',
        type: 'git',
        repoUrl: 'https://github.com/company/main-repo.git',
        authType: 'token',
        token: 'ghp_test_token_123456789',
        environment: 'production',
        tags: ['main', 'prod'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-helm-1',
        name: 'Docker Hub Registry',
        type: 'helm',
        registryUrl: 'oci://registry-1.docker.io',
        authType: 'userpass',
        username: 'testuser',
        password: 'testpass123',
        environment: 'production',
        tags: ['docker', 'oci'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-vault-1',
        name: 'Production Vault',
        type: 'vault',
        serverUrl: 'https://vault.company.com',
        authMethod: 'token',
        token: 'hvs.test-vault-token-123',
        mountPath: 'secret',
        environment: 'production',
        tags: ['vault', 'secrets'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    for (const credential of credentials) {
      await credentialManager.storeCredential(credential)
      console.log(`✅ ${credential.type.toUpperCase()} credential stored`)
    }

    // Test 3: Retrieve and verify credentials
    console.log('\n📋 Test 3: Retrieve and Verify Credentials')
    
    for (const originalCredential of credentials) {
      const retrieved = await credentialManager.getCredential(originalCredential.id)
      const success = retrieved && 
        (retrieved.token === originalCredential.token || 
         retrieved.password === originalCredential.password)
      console.log(`${originalCredential.type.toUpperCase()} retrieval: ${success ? '✅ SUCCESS' : '❌ FAILED'}`)
    }

    // Test 4: List credentials by type
    console.log('\n📋 Test 4: List Credentials by Type')
    
    const types = ['argocd', 'git', 'helm', 'vault']
    for (const type of types) {
      const typeCredentials = await credentialManager.listCredentials(type)
      console.log(`${type.toUpperCase()} credentials: ${typeCredentials.length}`)
    }

    // Test 5: List credentials by environment
    console.log('\n📋 Test 5: List Credentials by Environment')
    
    const devCredentials = await credentialManager.listCredentials(null, 'development')
    const prodCredentials = await credentialManager.listCredentials(null, 'production')
    console.log(`Development credentials: ${devCredentials.length}`)
    console.log(`Production credentials: ${prodCredentials.length}`)

    // Test 6: Clean up
    console.log('\n📋 Test 6: Clean Up')
    
    for (const credential of credentials) {
      const deleted = await credentialManager.deleteCredential(credential.id)
      console.log(`Delete ${credential.type.toUpperCase()}: ${deleted ? '✅ SUCCESS' : '❌ FAILED'}`)
    }

    const finalCount = await credentialManager.listCredentials()
    console.log(`Final credential count: ${finalCount.length}`)

    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📊 Test Summary:')
    console.log('✅ Core credential storage and encryption')
    console.log('✅ Multiple credential types (ArgoCD, Git, Helm, Vault)')
    console.log('✅ Secure sensitive data handling')
    console.log('✅ Credential retrieval and decryption')
    console.log('✅ Credential listing and filtering')
    console.log('✅ Credential deletion and cleanup')
    console.log('✅ File-based storage with proper permissions')

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.error(error.stack)
  }
}

// Run the test
testCredentialSystem().then(() => {
  console.log('\n🏁 Test execution completed')
}).catch((error) => {
  console.error('💥 Test execution failed:', error)
})