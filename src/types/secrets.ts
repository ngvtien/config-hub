export interface SecretItem {
  name: string
  vaultRef: {
    path: string
    key: string
  }
}

export interface SortConfig {
  key: string
  direction: 'ascending' | 'descending'
}

export interface SecretsFormData {
  env: SecretItem[]
}
