import { ipcMain } from 'electron'
import os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface SystemUser {
    username: string
    fullName?: string
    domain?: string
    isAdmin?: boolean
    groups?: string[]
}

export interface UserInfo {
    current: SystemUser
    available?: SystemUser[]
}

// Get current system user information
async function getCurrentUser(): Promise<SystemUser> {
    const userInfo = os.userInfo()
    const username = userInfo.username

    let fullName: string | undefined
    let domain: string | undefined
    let isAdmin = false
    let groups: string[] = []

    try {
        if (process.platform === 'win32') {
            // Windows-specific user info
            const { stdout: whoamiOutput } = await execAsync('whoami /fqdn')
            const fqdnMatch = whoamiOutput.trim().match(/^(.+?)\\(.+)$/)
            if (fqdnMatch) {
                domain = fqdnMatch[1]
            }

            // Get full name from Windows
            try {
                const { stdout: netOutput } = await execAsync(`net user "${username}" /domain 2>nul || net user "${username}"`)
                const fullNameMatch = netOutput.match(/Full Name\s+(.+)/i)
                if (fullNameMatch) {
                    fullName = fullNameMatch[1].trim()
                }
            } catch (error) {
                // Fallback to local user query
                console.warn('Could not get full name from domain, trying local:', error)
            }

            // Check if user is admin
            try {
                const { stdout: groupOutput } = await execAsync('net localgroup administrators')
                isAdmin = groupOutput.toLowerCase().includes(username.toLowerCase())
            } catch (error) {
                console.warn('Could not check admin status:', error)
            }

            // Get user groups
            try {
                const { stdout: groupsOutput } = await execAsync(`whoami /groups /fo csv`)
                const lines = groupsOutput.split('\n').slice(1) // Skip header
                groups = lines
                    .map(line => {
                        const match = line.match(/"([^"]+)"/)
                        return match ? match[1] : null
                    })
                    .filter(Boolean) as string[]
            } catch (error) {
                console.warn('Could not get user groups:', error)
            }
        } else {
            // Unix-like systems (macOS, Linux)
            try {
                const { stdout: idOutput } = await execAsync('id')
                const groupsMatch = idOutput.match(/groups=(.+)/)
                if (groupsMatch) {
                    groups = groupsMatch[1].split(',').map(g => g.trim())
                }

                // Check if user has sudo privileges
                try {
                    await execAsync('sudo -n true')
                    isAdmin = true
                } catch {
                    isAdmin = false
                }
            } catch (error) {
                console.warn('Could not get Unix user info:', error)
            }
        }
    } catch (error) {
        console.error('Error getting extended user info:', error)
    }

    return {
        username,
        fullName: fullName || userInfo.username,
        domain,
        isAdmin,
        groups
    }
}

// Get available users (Windows only - requires admin privileges)
async function getAvailableUsers(): Promise<SystemUser[]> {
    if (process.platform !== 'win32') {
        return []
    }

    try {
        const { stdout } = await execAsync('net user')
        const lines = stdout.split('\n')
        const userLines = lines.slice(4, -2) // Skip header and footer
        const users: string[] = []

        userLines.forEach(line => {
            const userMatches = line.match(/\S+/g)
            if (userMatches) {
                users.push(...userMatches)
            }
        })

        // Filter out system accounts
        const filteredUsers = users.filter(user =>
            !['Administrator', 'Guest', 'DefaultAccount', 'WDAGUtilityAccount'].includes(user)
        )

        return filteredUsers.map(username => ({ username }))
    } catch (error) {
        console.warn('Could not get available users (may require admin privileges):', error)
        return []
    }
}

// Switch user context (this would typically restart the app with different credentials)
async function switchUser(username: string, password?: string): Promise<boolean> {
    // Note: Actually switching users requires elevated privileges and is complex
    // This is more of a "run as different user" scenario

    if (process.platform === 'win32' && password) {
        try {
            // This would require implementing a secure credential store
            // and potentially restarting the application with different credentials
            console.log(`Attempting to switch to user: ${username}`)

            // For now, just validate the credentials
            const { stdout } = await execAsync(`echo. | runas /user:${username} "cmd /c echo success" 2>&1`)
            return stdout.includes('success')
        } catch (error) {
            console.error('User switch failed:', error)
            return false
        }
    }

    return false
}

export function setupUserHandlers() {
    // Get current user information
    ipcMain.handle('user:get-current', async () => {
        try {
            return await getCurrentUser()
        } catch (error) {
            console.error('Failed to get current user:', error)
            throw error
        }
    })

    // Get available users
    ipcMain.handle('user:get-available', async () => {
        try {
            return await getAvailableUsers()
        } catch (error) {
            console.error('Failed to get available users:', error)
            throw error
        }
    })

    // Switch user (placeholder - requires careful implementation)
    ipcMain.handle('user:switch', async (_, username: string, password?: string) => {
        try {
            return await switchUser(username, password)
        } catch (error) {
            console.error('Failed to switch user:', error)
            throw error
        }
    })

    // Check if current user has admin privileges
    ipcMain.handle('user:is-admin', async () => {
        try {
            const user = await getCurrentUser()
            return user.isAdmin
        } catch (error) {
            console.error('Failed to check admin status:', error)
            return false
        }
    })
}