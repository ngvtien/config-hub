# Security Architecture - ArgoCD Integration

## Overview

The ArgoCD integration has been designed with security as a primary concern, implementing a secure IPC-based architecture that follows Electron security best practices.

## Security Model

### 1. **IPC-Based Architecture**
- **No Direct HTTP from Renderer**: All ArgoCD API calls are made from the main process via IPC
- **Credential Isolation**: ArgoCD tokens never exist in the renderer process
- **Request Validation**: All requests are validated in the main process before execution
- **Secure Communication**: Uses Electron's contextBridge for secure IPC communication

### 2. **Credential Management**

#### Storage
- **File-based Storage**: Credentials stored in user data directory with restricted permissions (0o600)
- **Environment Isolation**: Separate credential storage per environment (dev/sit/uat/prod)
- **Structured Storage**: JSON format with clear separation of concerns

#### Security Measures
- **No Renderer Access**: Credentials never exposed to renderer process
- **Automatic Cleanup**: Credentials cleared when cache is reset
- **Validation**: Server URL format validation to prevent malicious endpoints
- **Path Traversal Protection**: Endpoint validation prevents directory traversal attacks

#### Future Enhancements
- **Encryption at Rest**: Consider implementing credential encryption using node's crypto module
- **Keytar Integration**: Use system keychain/credential manager for enhanced security
- **Token Rotation**: Implement automatic token refresh mechanisms

### 3. **Network Security**

#### HTTPS Enforcement
- **SSL Certificate Validation**: `rejectUnauthorized: true` enforces valid certificates
- **Secure Transport**: All communications use HTTPS
- **Timeout Protection**: 30-second timeout prevents hanging connections

#### Request Security
- **Input Sanitization**: All parameters validated before API calls
- **URL Validation**: Server URLs validated using URL constructor
- **Method Restriction**: Only allowed HTTP methods (GET, POST, PUT, DELETE)

### 4. **Process Isolation**

#### Main Process Responsibilities
- **API Communication**: All external HTTP requests
- **Credential Storage**: Secure credential management
- **Request Validation**: Input validation and sanitization
- **Error Handling**: Centralized error handling and logging

#### Renderer Process Restrictions
- **No Network Access**: Cannot make direct HTTP requests to ArgoCD
- **No Credential Access**: Cannot access stored credentials
- **IPC Only**: Must use IPC for all ArgoCD operations
- **Context Isolation**: Runs in isolated context with limited privileges

### 5. **Data Flow Security**

```
┌─────────────────┐    IPC     ┌──────────────────┐    HTTPS    ┌─────────────┐
│  Renderer       │ ────────► │  Main Process    │ ──────────► │  ArgoCD     │
│  (UI Layer)     │           │  (Security Layer)│             │  Server     │
│                 │           │                  │             │             │
│ - No credentials│           │ - Store creds    │             │ - REST API  │
│ - UI components │           │ - Validate reqs  │             │ - Auth      │
│ - User input    │           │ - Make API calls │             │ - Resources │
└─────────────────┘           └──────────────────┘             └─────────────┘
```

## Security Benefits

### 1. **Credential Protection**
- **Zero Exposure**: Credentials never accessible from renderer process
- **Secure Storage**: File permissions restrict access to user only
- **Environment Isolation**: Separate credentials per environment prevent cross-contamination

### 2. **Attack Surface Reduction**
- **No Direct Network**: Renderer cannot make unauthorized network requests
- **Validated Requests**: All requests validated before execution
- **Controlled Access**: Only specific ArgoCD operations exposed via IPC

### 3. **Audit Trail**
- **Centralized Logging**: All API requests logged in main process
- **Error Tracking**: Comprehensive error logging for security monitoring
- **Request Tracing**: Environment and operation tracking for audit purposes

## Implementation Details

### IPC Handlers
```typescript
// Secure credential storage
ipcMain.handle('argocd:store-credentials', async (_, environment, config) => {
  // Validation and secure storage
})

// Validated API requests
ipcMain.handle('argocd:get-applications', async (_, environment) => {
  // Credential retrieval and API call
})
```

### Credential Storage
```typescript
class SecureCredentialStore {
  private credentialsFile: string
  
  storeCredentials(environment: string, config: ArgoCDConfig): void {
    // Store with restricted file permissions (0o600)
    fs.writeFileSync(this.credentialsFile, data, { mode: 0o600 })
  }
}
```

### Request Validation
```typescript
private validateRequest(request: ArgoCDRequest): void {
  // URL format validation
  new URL(request.config.serverUrl)
  
  // Path traversal prevention
  if (request.endpoint.includes('..') || request.endpoint.includes('//')) {
    throw new Error('Invalid endpoint format')
  }
}
```

## Security Considerations

### Current Limitations
1. **Credential Encryption**: Credentials stored in plaintext (consider encryption)
2. **Token Expiration**: No automatic token refresh mechanism
3. **Certificate Pinning**: Could implement certificate pinning for enhanced security

### Recommended Practices
1. **Regular Token Rotation**: Rotate ArgoCD tokens regularly
2. **Least Privilege**: Use read-only tokens when possible
3. **Network Security**: Ensure ArgoCD servers use valid SSL certificates
4. **Access Control**: Implement proper RBAC in ArgoCD
5. **Monitoring**: Monitor API access patterns for anomalies

### Production Deployment
1. **Environment Variables**: Consider environment-based configuration
2. **Secrets Management**: Integrate with enterprise secrets management
3. **Audit Logging**: Implement comprehensive audit logging
4. **Network Policies**: Use network policies to restrict ArgoCD access
5. **Regular Updates**: Keep Electron and dependencies updated

## Comparison with Direct HTTP Approach

| Aspect | Direct HTTP (Insecure) | IPC-Based (Secure) |
|--------|----------------------|-------------------|
| Credential Exposure | ❌ Exposed in renderer | ✅ Isolated in main process |
| Network Control | ❌ Uncontrolled access | ✅ Validated requests only |
| Attack Surface | ❌ Large surface area | ✅ Minimal, controlled surface |
| Audit Trail | ❌ Difficult to track | ✅ Centralized logging |
| Validation | ❌ Client-side only | ✅ Server-side validation |
| Error Handling | ❌ Exposed errors | ✅ Sanitized error responses |

## Security Testing

### Recommended Tests
1. **Credential Isolation**: Verify renderer cannot access credentials
2. **Request Validation**: Test malformed requests are rejected
3. **Path Traversal**: Verify endpoint validation prevents traversal
4. **Network Isolation**: Confirm renderer cannot make direct HTTP requests
5. **Error Handling**: Ensure errors don't leak sensitive information

### Security Audit Checklist
- [ ] Credentials stored with proper file permissions
- [ ] No credentials accessible from renderer process
- [ ] All API requests validated before execution
- [ ] HTTPS enforced with certificate validation
- [ ] Error messages sanitized
- [ ] Audit logging implemented
- [ ] Input validation comprehensive
- [ ] No path traversal vulnerabilities

This security architecture provides a robust foundation for ArgoCD integration while maintaining the principle of least privilege and defense in depth.