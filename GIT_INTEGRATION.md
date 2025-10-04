# Git Integration - Complete Implementation

## Overview

Comprehensive Git credential management system with multi-provider support, secure credential storage, and user-friendly UI for managing Git repositories across different environments.

---

## Features

### Supported Providers
- **Bitbucket Server** (Self-hosted, e.g., `http://localhost:7990/`)
- **Bitbucket Cloud** (`https://bitbucket.org/`)
- **GitHub** (`https://github.com/`)
- **GitLab** (`https://gitlab.com/`)
- **Gitea** (Self-hosted)
- **Generic Git Servers**

### Authentication Methods
1. **Username/Password** - Basic authentication
2. **Access Token/App Password** - Token-based authentication
3. **SSH Keys** - Public/private key authentication with optional passphrase

### Security
- OS-level encryption (Electron safeStorage + AES-256-CBC fallback)
- IPC isolation (credentials never in renderer process)
- File permissions: 0o600 for private keys
- Environment-based credential separation
- Duplicate prevention

---

## Quick Start

### 1. Configure Git Credentials

Navigate to **Settings** → **Git Repositories**

**For Bitbucket Server (Local)**:
```
Provider: Bitbucket Server
Name: Bitbucket DEV
URL: http://localhost:7990/
Auth: Username/Password
Username: admin
Password: your-password
```

**For GitHub/GitLab (Token)**:
```
Provider: GitHub
Name: GitHub Work
URL: https://github.com/
Auth: Access Token
Token: ghp_xxxxxxxxxxxx
```

**For SSH Keys**:
```
Provider: GitLab
Name: GitLab Personal
URL: https://gitlab.com/
Auth: SSH Key
1. Enter Key Name: gitlab-key
2. Click "Generate SSH Key"
3. Copy public key
4. Add to Git provider
```

### 2. Test & Save
1. Click **Test Connection** to verify
2. Click **Save Configuration** to store securely

---

## Provider-Specific Setup

### Bitbucket Server
- **URL**: `http://localhost:7990/`
- **SSH Port**: 7999
- **Auth**: Username/Password or SSH Key
- **Test**: `ssh -p 7999 git@localhost`

### Bitbucket Cloud
- **URL**: `https://bitbucket.org/`
- **Auth**: App Password (Settings → App passwords)
- **Scopes**: Account: Read, Repositories: Read

### GitHub
- **URL**: `https://github.com/`
- **Auth**: Personal Access Token (Settings → Developer settings)
- **Scope**: `repo`

### GitLab
- **URL**: `https://gitlab.com/`
- **Auth**: Personal Access Token (User Settings → Access Tokens)
- **Scope**: `read_repository`

### Gitea
- **URL**: `https://gitea.example.com/`
- **Auth**: Access Token (User Settings → Applications)

---

## SSH Key Generation

### Generate New Key
1. Select **SSH Key** authentication
2. Enter **Key Name**: e.g., `github-work`
3. Enter **Passphrase** (optional but recommended)
4. Click **Generate SSH Key**
5. Copy **Public Key** and add to Git provider

### Key Storage
- Private: `~/.ssh/git_{keyname}` (0o600)
- Public: `~/.ssh/git_{keyname}.pub` (0o644)
- Config: Auto-updated in `~/.ssh/config`

### Test SSH
```bash
# GitHub
ssh -T git@github.com

# Bitbucket Cloud
ssh -T git@bitbucket.org

# Bitbucket Server
ssh -p 7999 git@localhost

# GitLab
ssh -T git@gitlab.com
```

---

## UI Features

### Saved Configurations
- View all saved configurations
- Provider icons for identification
- Quick Test/Delete buttons
- Inline status indicators (✅ Connected, ❌ Failed, 🔄 Testing)

### Duplicate Detection
- Real-time duplicate checking
- Visual warning when duplicate detected
- Prevents saving duplicates
- Checks: URL + Auth Type + Username

### Provider Hints
- Bitbucket Server: "SSH uses port 7999, HTTP uses port 7990"
- Bitbucket Cloud: "Use App Passwords instead of account password"
- GitHub: "Generate Personal Access Token with 'repo' scope"
- GitLab: "Create Personal Access Token in User Settings"

---

## Security Architecture

### Credential Storage
```
userData/
├── credentials-metadata.json      # Non-sensitive metadata
├── sensitive/                     # Encrypted credential files
│   ├── git-{credential-id}.enc   # Individual encrypted credentials
│   └── ...
└── .master-key                   # Fallback encryption key
```

### Encryption Flow
```
Settings UI (Renderer)
    ↓ IPC (Secure)
Main Process (Security Layer)
    ↓ OS Encryption
File Storage (Encrypted)
    ↓ IPC (Secure)
Git Operations (Main Process)
    ↓ HTTPS/SSH
Git Server
```

---

## Troubleshooting

### Connection Test Fails
- ✓ Verify repository URL is correct
- ✓ Check network connectivity
- ✓ Ensure Git server is accessible
- ✓ Verify credentials are valid
- ✓ Check firewall/proxy settings

### SSH Authentication Fails
- ✓ Verify public key is added to Git provider
- ✓ Check SSH key permissions (0o600 for private key)
- ✓ Test SSH manually: `ssh -T git@github.com`
- ✓ For Bitbucket Server: Use port 7999

**Note**: "shell request failed" for Bitbucket Server is **success** - authentication worked but shell access is denied (normal).

### Duplicate Configuration Warning
- ✓ Use different repository URL
- ✓ Use different authentication method
- ✓ Use different username
- ✓ Delete existing duplicate configuration

---

## API Reference

### Store Credentials
```typescript
const result = await window.electronAPI.git.storeCredential({
  name: 'GitHub Work',
  repoUrl: 'https://github.com/',
  authType: 'token',
  token: 'ghp_xxxxxxxxxxxx',
  environment: 'production',
  tags: ['github', 'work']
})
```

### Test Credentials
```typescript
const result = await window.electronAPI.git.testCredential(credentialId)
```

### List Credentials
```typescript
const result = await window.electronAPI.git.listCredentials('production')
```

### Delete Credentials
```typescript
const result = await window.electronAPI.git.deleteCredential(credentialId)
```

### Generate SSH Key
```typescript
const result = await window.electronAPI.git.generateSSHKey('my-key', 'passphrase')
```

### Clone Repository
```typescript
const result = await window.electronAPI.git.cloneRepository(
  credentialId,
  '/path/to/local/repo',
  'main'
)
```

---

## Best Practices

### Security
1. Use Access Tokens when possible
2. Rotate credentials regularly (every 90 days)
3. Use SSH Keys for automated operations
4. Limit token scope to minimum required
5. Use passphrases for SSH keys in production

### Configuration
1. Test before saving
2. Use descriptive names
3. Tag credentials appropriately
4. Review stored credentials periodically

---

## Implementation Summary

### Files Modified
- `src/components/settings-page.tsx` - Git configuration UI
- `src/vite-env.d.ts` - Git/Helm type definitions
- `src/hooks/use-environment-settings.ts` - Added credentialId support
- `electron/simple-git-handler.ts` - Enhanced with provider detection
- `electron/main.ts` - Fixed handler loading timing

### Key Achievements
- ✅ Multi-provider support (6 providers)
- ✅ Three authentication methods
- ✅ SSH key generation (RSA 4096-bit)
- ✅ Secure OS-level encryption
- ✅ Duplicate detection and prevention
- ✅ Saved configurations with inline status
- ✅ Provider-specific hints and auto-detection
- ✅ Cross-platform support (Windows, Mac, Linux)

### Issues Resolved
- Handler loading race condition
- SSH test on Windows (removed Unix-specific syntax)
- SSH key generation hanging (CMD instead of PowerShell)
- Bitbucket Server SSH detection (port 7999)
- "shell request failed" as success indicator
- Duplicate credential prevention
- Inline status visibility

---

*Last Updated: 2025-10-04*
*Status: ✅ Production Ready*
