// Simple Node.js script to test startup timing
console.log('Node.js script starting...', new Date().toISOString())

const startTime = Date.now()

// Test file system access
const fs = require('fs')
const path = require('path')

console.log('Testing file system access...')
try {
    const files = fs.readdirSync('.')
    console.log('Directory listing successful, found', files.length, 'files')
} catch (error) {
    console.error('File system error:', error)
}

// Test path resolution
console.log('Testing path resolution...')
console.log('Current directory:', process.cwd())
console.log('Script directory:', __dirname)

// Test module loading
console.log('Testing module loading...')
try {
    const electronPath = require.resolve('electron')
    console.log('Electron found at:', electronPath)
} catch (error) {
    console.error('Electron not found:', error)
}

const endTime = Date.now()
console.log('Script completed in', endTime - startTime, 'ms')
console.log('Script ending...', new Date().toISOString())