/**
 * Credential Migration Utility
 * Migrates credentials from old service name (electron-devops-app) to new (config-hub)
 */

let keytar: any = null
try {
  keytar = require('keytar')
} catch (error) {
  console.warn('Keytar not available for migration:', error)
}

export async function migrateCredentialsFromOldServiceName(): Promise<{ success: boolean; migrated: number; errors: string[] }> {
  if (!keytar) {
    return { success: false, migrated: 0, errors: ['Keytar not available'] }
  }

  const oldServiceName = 'electron-devops-app'
  const newServiceName = 'config-hub'
  const errors: string[] = []
  let migrated = 0

  try {
    console.log('Starting credential migration from', oldServiceName, 'to', newServiceName)

    // Get all credentials from old service
    const oldCredentials = await keytar.findCredentials(oldServiceName)
    
    if (!oldCredentials || oldCredentials.length === 0) {
      console.log('No credentials found to migrate')
      return { success: true, migrated: 0, errors: [] }
    }

    console.log(`Found ${oldCredentials.length} credentials to migrate`)

    // Migrate each credential
    for (const cred of oldCredentials) {
      try {
        const { account, password } = cred
        
        // Check if already exists in new service
        const existing = await keytar.getPassword(newServiceName, account)
        if (existing) {
          console.log(`Credential ${account} already exists in new service, skipping`)
          continue
        }

        // Copy to new service
        await keytar.setPassword(newServiceName, account, password)
        console.log(`Migrated credential: ${account}`)
        migrated++
      } catch (error) {
        const errorMsg = `Failed to migrate ${cred.account}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    console.log(`Migration complete: ${migrated} credentials migrated, ${errors.length} errors`)
    return { success: true, migrated, errors }
  } catch (error) {
    const errorMsg = `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    console.error(errorMsg)
    return { success: false, migrated, errors: [errorMsg, ...errors] }
  }
}

/**
 * Check if migration is needed
 */
export async function needsMigration(): Promise<boolean> {
  if (!keytar) {
    return false
  }

  try {
    const oldServiceName = 'electron-devops-app'
    const oldCredentials = await keytar.findCredentials(oldServiceName)
    return oldCredentials && oldCredentials.length > 0
  } catch (error) {
    console.error('Failed to check migration status:', error)
    return false
  }
}
