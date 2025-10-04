// HashiCorp Vault API Types
export interface VaultConfig {
  serverUrl: string
  authMethod: 'token' | 'userpass' | 'ldap' | 'kubernetes' | 'aws' | 'azure'
  token?: string
  username?: string
  password?: string
  namespace?: string
  mountPath: string
  roleId?: string
  secretId?: string
  kubernetesRole?: string
  awsRole?: string
  azureRole?: string
}

export interface VaultAuthResponse {
  auth: {
    client_token: string
    accessor: string
    policies: string[]
    token_policies: string[]
    metadata: Record<string, any>
    lease_duration: number
    renewable: boolean
    entity_id: string
    token_type: string
    orphan: boolean
  }
}

export interface VaultSecret {
  request_id: string
  lease_id: string
  renewable: boolean
  lease_duration: number
  data: {
    data: Record<string, any>
    metadata: {
      created_time: string
      deletion_time: string
      destroyed: boolean
      version: number
    }
  }
  wrap_info: null
  warnings: null
  auth: null
}

export interface VaultSecretMetadata {
  request_id: string
  lease_id: string
  renewable: boolean
  lease_duration: number
  data: {
    cas_required: boolean
    created_time: string
    current_version: number
    delete_version_after: string
    max_versions: number
    oldest_version: number
    updated_time: string
    versions: Record<string, {
      created_time: string
      deletion_time: string
      destroyed: boolean
    }>
  }
}

export interface VaultSecretList {
  request_id: string
  lease_id: string
  renewable: boolean
  lease_duration: number
  data: {
    keys: string[]
  }
}

export interface VaultHealth {
  initialized: boolean
  sealed: boolean
  standby: boolean
  performance_standby: boolean
  replication_performance_mode: string
  replication_dr_mode: string
  server_time_utc: number
  version: string
  cluster_name: string
  cluster_id: string
}

export interface VaultPolicy {
  name: string
  rules: string
}

export interface VaultMount {
  type: string
  description: string
  config: {
    default_lease_ttl: number
    max_lease_ttl: number
    force_no_cache: boolean
  }
  local: boolean
  seal_wrap: boolean
  external_entropy_access: boolean
  options: Record<string, any>
  uuid: string
  accessor: string
}

export interface VaultSecretEngine {
  [path: string]: VaultMount
}

export interface VaultTokenInfo {
  accessor: string
  creation_time: number
  creation_ttl: number
  display_name: string
  entity_id: string
  expire_time: string
  explicit_max_ttl: number
  id: string
  issue_time: string
  meta: Record<string, any>
  num_uses: number
  orphan: boolean
  path: string
  policies: string[]
  renewable: boolean
  ttl: number
  type: string
}

export interface VaultError {
  errors: string[]
}