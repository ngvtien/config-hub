# Vault Integration Setup Plan

## Overview
Enhance Vault settings UI similar to Git integration with comprehensive authentication testing, credential management, and saved configurations.

## Current Status
- ✅ Vault handler exists with all auth methods (token, userpass, ldap, kubernetes, aws, azure)
- ✅ Vault IPC handlers implemented
- ✅ Basic Vault settings UI exists
- ❌ No test connection functionality
- ❌ No saved configurations list
- ❌ No inline status indicators
- ❌ No duplicate detection

## Implementation Plan

### 1. Enhanced Vault Settings UI (settings-page.tsx)
Replace `renderVaultSettings` function (lines 1414-1458) with enhanced version that includes:

**Features to Add:**
- Saved configurations list with Test/Delete buttons
- Inline status indicators per configuration
- Test connection before saving
- Duplicate detection and prevention
- Password/token visibility toggles
- Loading states for all async operations
- Provider-specific hints for each auth method
- Configuration name field
- Support for all 6 auth methods:
  - Token (root/service token)
  - Username/Password
  - LDAP
  - Kubernetes
  - AWS IAM (coming soon indicator)
  - Azure (coming soon indicator)

**UI Components:**
- Configuration name input
- Server URL input with local K8s hint
- Auth method selector with icons
- Auth-specific credential inputs
- Namespace input (optional, for Enterprise)
- Mount path input (default: secret)
- Test Connection button
- Save Configuration button
- Saved configurations list
- Duplicate warning banner
- Status message banner

### 2. Local Vault Instance
**URL:** `http://vault.k8s.local/`
**Setup:** Bare minimal with token/root login

**Test Scenarios:**
1. Token authentication with root token
2. Username/Password authentication (if enabled)
3. LDAP authentication (if configured)
4. Kubernetes authentication (if in K8s)
5. Connection health check
6. Secret read/write operations

### 3. Security & Consistency
**Must maintain:**
- OS-level encryption (Electron safeStorage)
- IPC isolation (credentials never in renderer)
- File permissions: 0o600
- Environment-based separation
- Duplicate prevention
- Secure credential ID system

### 4. Testing Checklist
- [ ] Token authentication test
- [ ] Username/Password authentication test
- [ ] LDAP authentication test
- [ ] Kubernetes authentication test
- [ ] Save configuration
- [ ] Load existing configuration
- [ ] Test connection
- [ ] Delete configuration
- [ ] Duplicate detection
- [ ] Inline status indicators
- [ ] Multiple configurations per environment

## Files to Modify

### src/components/settings-page.tsx
- Replace `renderVaultSettings` function (lines 1414-1458)
- Add state management for Vault settings
- Add test connection logic
- Add save configuration logic
- Add saved configurations list
- Add duplicate detection

### electron/vault-handler.ts
- ✅ Already has all required handlers
- ✅ Test connection implemented
- ✅ Store credentials implemented
- ✅ List credentials implemented
- ✅ Delete credentials implemented

### src/vite-env.d.ts
- ✅ Vault types already defined
- May need to add credentialId to VaultSettings interface

### src/hooks/use-environment-settings.ts
- ✅ Vault settings already included
- May need to add credentialId field

## Implementation Steps

1. **Backup current settings-page.tsx**
2. **Read the enhanced Vault settings from .output/vault-settings-snippet.txt**
3. **Replace lines 1414-1458 in settings-page.tsx**
4. **Test the implementation:**
   - Start dev server
   - Navigate to Settings → Vault
   - Test with local Vault at http://vault.k8s.local/
   - Test all authentication methods
   - Test save/load/delete operations
5. **Update documentation**
6. **Create commit message**

## Expected Outcome

### Before
- Basic form with auth method selector
- No test functionality
- No saved configurations
- No status indicators
- Manual credential entry each time

### After
- Comprehensive UI with all auth methods
- Test connection before saving
- Saved configurations list
- Inline status per configuration
- Duplicate detection
- Password/token visibility toggles
- Loading states
- Provider-specific hints
- Consistent with Git/ArgoCD patterns

## Next Steps

1. Replace the renderVaultSettings function
2. Test with local Vault instance
3. Verify all auth methods work
4. Create documentation
5. Commit changes

---

*Plan created: 2025-10-04*
*Status: Ready to implement*
