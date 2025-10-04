# HashiCorp Vault Integration

## Overview

The application now includes comprehensive HashiCorp Vault integration for secure secrets management across different environments (dev, sit, uat, prod). This integration follows the same secure IPC-based architecture as the ArgoCD integration.

## Features

### 1. **Multi-Authentication Support**
- **Token Authentication**: Direct Vault token access
- **Username/Password**: Traditional username/password authentication
- **LDAP**: Enterprise LDAP integration
- **Kubernetes**: Service account token authentication
- **AWS IAM**: AWS role-based authentication (planned)
- **Azure**: Azure managed identity authentication (planned)

### 2. **Secure Credential Management**
- **IPC-Based Architecture**: All Vault API calls through secure main process
- **Environment Isolation**: Separate credentials per environment
- **Token Caching**: Automatic token renewal and caching
- **Encrypted Storage**: Secure credential storage with restricted file permissions

### 3. **Secret Operations**
- **Read Secrets**: Retrieve secret values from Vault
- **Write Secrets**: Store new secrets in Vault
- **List Secrets**: Browse available secrets
- **Delete Secrets**: Remove secrets from Vault
- **Health Monitoring**: Check Vault server health and status

### 4. **Enterprise Features**
- **Namespace Support**: Vault Enterprise namespace isolation
- **Mount Path Configuration**: Configurable secret engine mount paths
- **Policy Management**: Integration with Vault policies
- **Audit Trail**: Comprehensive logging of all Vault operations

## Configuration

### Vault Settings
Configure Vault connection settings in the Settings page under "HashiCorp Vault":

#### Basic Configuration
- **Vault Server URL**: Your Vault server URL (e.g., `https://vault.example.com:8200`)
- **Authentication Method**: Choose from available auth methods
- **Namespace**: Vault Enterprise namespace (optional)
- **Mount Path**: Secret engine mount path (default: `secret`)

#### Authentication Methods

##### Token Authentication
```typescript
{
  authMethod: 'token',
  token: 'hvs.CAESIJ...'
}
```

##### Username/Password Authentication
```typescript
{
  authMethod: 'userpass',
  username: 'myuser',
  password: 'mypassword'
}
```

##### LDAP Authentication
```typescript
{
  authMethod: 'ldap',
  username: 'ldapuser',
  password: 'ldappassword'
}
```

##### Kubernetes Authentication
```typescript
{
  authMethod: 'kubernetes',
  kubernetesRole: 'my-k8s-role'
}
```

## Security Architecture

### IPC-Based Security Model
```
┌─────────────────┐    IPC    ┌──────────────────┐    HTTPS    ┌─────────────┐
│  Renderer       │ ────────► │  Main Process    │ ──────────► │  Vault      │
│  (UI Layer)     │           │  (Security Layer)│             │  Server     │
│                 │           │                  │             │             │
│ - No credentials│           │ - Store creds    │             │ - Secrets   │
│ - UI components │           │ - Authenticate   │             │ - Auth      │
│ - User input    │           │ - Make API calls │             │ - Policies  │
└─────────────────┘           └──────────────────┘             └─────────────┘
```

### Security Benefits
1. **Credential Isolation**: Vault tokens never exposed to renderer process
2. **Automatic Authentication**: Handles token renewal and authentication flows
3. **Secure Storage**: Credentials stored with restricted file permissions (0o600)
4. **Request Validation**: All requests validated before execution
5. **SSL/TLS Enforcement**: HTTPS required with certificate validation

## API Integration

### IPC Handlers
The integration provides secure IPC handlers for all Vault operations:

```typescript
// Store credentials securely
window.electronAPI.vault.storeCredentials(environment, config)

// Test connection and authentication
window.electronAPI.vault.testConnection(environment)

// Secret operations
window.electronAPI.vault.getSecret(environment, 'myapp/config')
window.electronAPI.vault.putSecret(environment, 'myapp/config', { key: 'value' })
window.electronAPI.vault.listSecrets(environment, 'myapp/')
window.electronAPI.vault.deleteSecret(environment, 'myapp/config')

// Health monitoring
window.electronAPI.vault.getHealth(environment)
```

### Authentication Flow
1. **Credential Storage**: Settings automatically stored via IPC
2. **Authentication**: Main process authenticates with Vault using configured method
3. **Token Caching**: Valid tokens cached with expiry tracking
4. **Auto-Renewal**: Tokens automatically renewed before expiry
5. **Request Execution**: API requests made with valid token

## Usage Examples

### Reading Secrets
```typescript
// Get a secret
const result = await window.electronAPI.vault.getSecret('prod', 'myapp/database')
if (result.success) {
  const secrets = result.data.data.data
  console.log('Database URL:', secrets.url)
  console.log('Database Password:', secrets.password)
}
```

### Writing Secrets
```typescript
// Store a secret
const secretData = {
  url: 'postgresql://localhost:5432/mydb',
  username: 'dbuser',
  password: 'securepassword'
}

const result = await window.electronAPI.vault.putSecret('prod', 'myapp/database', secretData)
if (result.success) {
  console.log('Secret stored successfully')
}
```

### Listing Secrets
```typescript
// List all secrets in a path
const result = await window.electronAPI.vault.listSecrets('prod', 'myapp/')
if (result.success) {
  console.log('Available secrets:', result.data)
}
```

## Environment-Specific Configuration

### Development Environment
```json
{
  "serverUrl": "http://localhost:8200",
  "authMethod": "token",
  "token": "dev-token",
  "mountPath": "secret"
}
```

### Production Environment
```json
{
  "serverUrl": "https://vault.company.com:8200",
  "authMethod": "ldap",
  "username": "prod-user",
  "password": "prod-password",
  "namespace": "production",
  "mountPath": "kv-v2"
}
```

## Error Handling

### Common Error Scenarios
1. **Authentication Failure**: Invalid credentials or expired tokens
2. **Permission Denied**: Insufficient Vault policies
3. **Network Issues**: Vault server unreachable
4. **Invalid Paths**: Secret paths don't exist
5. **Sealed Vault**: Vault server is sealed

### Error Response Format
```typescript
interface VaultResponse<T> {
  success: boolean
  data?: T
  error?: string
  connected?: boolean
}
```

## Best Practices

### Security
1. **Least Privilege**: Use minimal required Vault policies
2. **Token Rotation**: Regularly rotate Vault tokens
3. **Network Security**: Use HTTPS with valid certificates
4. **Access Logging**: Monitor Vault access patterns
5. **Environment Isolation**: Separate Vault instances per environment

### Performance
1. **Token Caching**: Leverage automatic token caching
2. **Batch Operations**: Group related secret operations
3. **Connection Pooling**: Reuse HTTP connections
4. **Error Handling**: Implement proper retry logic

### Operational
1. **Health Monitoring**: Regular health checks
2. **Backup Strategy**: Backup Vault data regularly
3. **Disaster Recovery**: Plan for Vault outages
4. **Monitoring**: Set up Vault metrics and alerting

## Integration with Other Services

### ArgoCD Integration
Use Vault secrets in ArgoCD applications:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
data:
  database-url: # Retrieved from Vault
  api-key: # Retrieved from Vault
```

### Helm Integration
Inject Vault secrets into Helm charts:
```yaml
# values.yaml
database:
  url: "{{ vault "secret/myapp/database" "url" }}"
  password: "{{ vault "secret/myapp/database" "password" }}"
```

## Troubleshooting

### Connection Issues
- Verify Vault server URL is accessible
- Check authentication credentials
- Ensure proper network connectivity
- Validate SSL certificates

### Authentication Problems
- Verify auth method configuration
- Check user permissions in Vault
- Ensure tokens haven't expired
- Validate namespace settings

### Permission Errors
- Review Vault policies
- Check secret path permissions
- Verify namespace access
- Confirm mount path configuration

## Future Enhancements

### Planned Features
1. **AWS IAM Authentication**: Complete AWS integration
2. **Azure Authentication**: Complete Azure integration
3. **AppRole Authentication**: Support for AppRole auth method
4. **Dynamic Secrets**: Integration with Vault dynamic secrets
5. **Secret Versioning**: Support for KV v2 secret versions
6. **Policy Management**: UI for managing Vault policies
7. **Audit Log Viewer**: View Vault audit logs in UI
8. **Secret Templates**: Predefined secret templates
9. **Bulk Operations**: Batch secret import/export
10. **Integration Testing**: Automated Vault integration tests

### Advanced Security
- **Hardware Security Modules**: HSM integration
- **Transit Encryption**: Vault transit engine integration
- **Certificate Management**: PKI secret engine integration
- **Identity Management**: Vault identity engine integration

This Vault integration provides enterprise-grade secrets management with a focus on security, usability, and operational excellence.