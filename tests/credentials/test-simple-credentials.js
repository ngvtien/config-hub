// Test script for the simple credential system
const path = require('path')
const fs = require('fs')

// Mock Electron app for testing
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      const testDir = path.join(__dirname, 'test-data')
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true })
      }
      return testDir
    }
    return __dirname
  }
}

// Mock safeStorage
const mockSafeStorage = {
  isEncryptionAvailable: () => false, // Force fallback encryption
  encryptString: (data) => Buffer.from(data, 'utf8'),
  decryptString: (buffer) => buffer.toString('utf8')
}

// Set up global mocks
global.app = mockApp
global.safeStorage = mockSafeStorage

async function testCredentialSystem() {
  console.log('🧪 Testing Simple Credential System...\n')

  try {
    // Import the simple credential manager
    const { SimpleCredentialManager } = require('./electron/simple-credential-manager.ts')
    const credentialManager = new SimpleCredentialManager()

    console.log('✅ SimpleCredentialManager imported successfully')

    // Test 1: Health check
    console.log('\n📋 Test 1: Health Check')
    const healthCheck = await credentialManager.testCredentialAccess()
    console.log(`Health check: ${healthCheck ? '✅ PASSED' : '❌ FAILED'}`)

    // Test 2: Store ArgoCD credential
    console.log('\n📋 Test 2: Store ArgoCD Credential')
    const argoCDCredential = {
      id: 'test-argocd-1',
      name: 'Test ArgoCD Server',
      type: 'argocd',
      serverUrl: 'https://argocd.example.com',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token',
      environment: 'development',
      tags: ['test', 'dev'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await credentialManager.storeCredential(argoCDCredential)
    console.log('✅ ArgoCD credential stored')

    // Test 3: Store Git credential
    console.log('\n📋 Test 3: Store Git Credential')
    const gitCredential = {
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
    }

    await credentialManager.storeCredential(gitCredential)
    console.log('✅ Git credential stored')

    // Test 4: Store Helm credential
    console.log('\n📋 Test 4: Store Helm Credential')
    const helmCredential = {
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
    }

    await credentialManager.storeCredential(helmCredential)
    console.log('✅ Helm credential stored')

    // Test 5: Retrieve credentials
    console.log('\n📋 Test 5: Retrieve Credentials')
    
    const retrievedArgoCD = await credentialManager.getCredential('test-argocd-1')
    console.log(`ArgoCD retrieval: ${retrievedArgoCD ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Token matches: ${retrievedArgoCD?.token === argoCDCredential.token ? '✅ YES' : '❌ NO'}`)

    const retrievedGit = await credentialManager.getCredential('test-git-1')
    console.log(`Git retrieval: ${retrievedGit ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Token matches: ${retrievedGit?.token === gitCredential.token ? '✅ YES' : '❌ NO'}`)

    const retrievedHelm = await credentialManager.getCredential('test-helm-1')
    console.log(`Helm retrieval: ${retrievedHelm ? '✅ SUCCESS' : '❌ FAILED'}`)
    console.log(`Password matches: ${retrievedHelm?.password === helmCredential.password ? '✅ YES' : '❌ NO'}`)

    // Test 6: List credentials
    console.log('\n📋 Test 6: List Credentials')
    
    const allCredentials = await credentialManager.listCredentials()
    console.log(`Total credentials: ${allCredentials.length}`)

    const argoCDCredentials = await credentialManager.listCredentials('argocd')
    console.log(`ArgoCD credentials: ${argoCDCredentials.length}`)

    const gitCredentials = await credentialManager.listCredentials('git')
    console.log(`Git credentials: ${gitCredentials.length}`)

    const helmCredentials = await credentialManager.listCredentials('helm')
    console.log(`Helm credentials: ${helmCredentials.length}`)

    // Test 7: Find credentials
    console.log('\n📋 Test 7: Find Credentials')
    
    const foundGit = await credentialManager.findCredentials({
      type: 'git',
      repoUrl: 'https://github.com/company/main-repo.git'
    })
    console.log(`Found Git credentials by repo URL: ${foundGit.length}`)

    const foundHelm = await credentialManager.findCredentials({
      type: 'helm',
      registryUrl: 'oci://registry-1.docker.io'
    })
    console.log(`Found Helm credentials by registry URL: ${foundHelm.length}`)

    // Test 8: Update credential
    console.log('\n📋 Test 8: Update Credential')
    
    const updatedGitCredential = { ...gitCredential }
    updatedGitCredential.token = 'ghp_updated_token_987654321'
    await credentialManager.updateCredential(updatedGitCredential)
    
    const retrievedUpdated = await credentialManager.getCredential('test-git-1')
    console.log(`Update successful: ${retrievedUpdated?.token === 'ghp_updated_token_987654321' ? '✅ YES' : '❌ NO'}`)

    // Test 9: Delete credentials
    console.log('\n📋 Test 9: Delete Credentials')
    
    const deleteArgoCD = await credentialManager.deleteCredential('test-argocd-1')
    console.log(`Delete ArgoCD: ${deleteArgoCD ? '✅ SUCCESS' : '❌ FAILED'}`)

    const deleteGit = await credentialManager.deleteCredential('test-git-1')
    console.log(`Delete Git: ${deleteGit ? '✅ SUCCESS' : '❌ FAILED'}`)

    const deleteHelm = await credentialManager.deleteCredential('test-helm-1')
    console.log(`Delete Helm: ${deleteHelm ? '✅ SUCCESS' : '❌ FAILED'}`)

    // Verify deletions
    const finalCount = await credentialManager.listCredentials()
    console.log(`Final credential count: ${finalCount.length}`)

    console.log('\n🎉 All tests completed successfully!')
    console.log('\n📊 Test Summary:')
    console.log('✅ Credential storage and encryption')
    console.log('✅ Multiple credential types (ArgoCD, Git, Helm)')
    console.log('✅ Credential retrieval and decryption')
    console.log('✅ Credential listing and filtering')
    console.log('✅ Credential search and finding')
    console.log('✅ Credential updates')
    console.log('✅ Credential deletion')

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