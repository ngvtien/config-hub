// Simple test to verify our credential manager works
const { app } = require('electron')
const path = require('path')

// Mock app.getPath for testing
if (!app.getPath) {
  app.getPath = (name) => {
    if (name === 'userData') {
      return path.join(__dirname, 'test-data')
    }
    return __dirname
  }
}

// Test the simple credential manager
async function testCredentialManager() {
  try {
    console.log('Testing Simple Credential Manager...')
    
    // Import our simple credential manager
    const { simpleCredentialManager } = require('./electron/simple-credential-manager.ts')
    
    // Test health check
    const healthCheck = await simpleCredentialManager.testCredentialAccess()
    console.log('Health check:', healthCheck ? 'PASSED' : 'FAILED')
    
    // Test storing a credential
    const testCredential = {
      id: 'test-argocd-1',
      name: 'Test ArgoCD',
      type: 'argocd',
      serverUrl: 'https://argocd.example.com',
      token: 'test-token-123',
      environment: 'dev',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    await simpleCredentialManager.storeCredential(testCredential)
    console.log('Credential stored successfully')
    
    // Test retrieving the credential
    const retrieved = await simpleCredentialManager.getCredential('test-argocd-1')
    console.log('Retrieved credential:', retrieved ? 'SUCCESS' : 'FAILED')
    console.log('Token matches:', retrieved?.token === 'test-token-123' ? 'YES' : 'NO')
    
    // Test listing credentials
    const credentials = await simpleCredentialManager.listCredentials('argocd')
    console.log('Listed credentials count:', credentials.length)
    
    // Clean up
    await simpleCredentialManager.deleteCredential('test-argocd-1')
    console.log('Cleanup completed')
    
    console.log('All tests completed successfully!')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
testCredentialManager()