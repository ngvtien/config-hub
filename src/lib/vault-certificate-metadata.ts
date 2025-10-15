// Vault Certificate Metadata Management
// Uses Vault KV2 custom metadata as the source of truth for certificate relationships

import type { CertificateItem, CertificateRelationship, CertificateType } from '@/types/certificates'

export interface VaultMetadataAPI {
  getSecret: (credId: string, path: string) => Promise<any>
  putSecret: (credId: string, path: string, data: any) => Promise<any>
  getMetadata: (credId: string, path: string) => Promise<any>
  putMetadata: (credId: string, path: string, metadata: Record<string, string>) => Promise<any>
  listSecrets: (credId: string, path: string) => Promise<any>
}

/**
 * Save certificate data and metadata to Vault
 * Metadata includes relationships and other certificate properties
 */
export async function saveCertificateToVault(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  cert: CertificateItem,
  environment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pathParts = cert.vaultRef.path.split('/')
    const secretPath = pathParts.slice(1).join('/')
    
    // 1. Save certificate data if provided
    if (cert.data) {
      const result = await vaultAPI.putSecret(
        credentialId,
        secretPath,
        {
          [cert.vaultRef.key]: {
            thumbprint: cert.data.thumbprint,
            definition: cert.data.definition,
            password: cert.data.password || ''
          }
        }
      )
      
      if (!result.success) {
        return { success: false, error: result.error || 'Failed to save certificate data' }
      }
    }
    
    // 2. Build custom metadata
    const metadata = buildMetadataFromCertificate(cert, environment)
    
    // 3. Save metadata
    const metadataResult = await vaultAPI.putMetadata(
      credentialId,
      secretPath,
      metadata
    )
    
    if (!metadataResult.success) {
      return { success: false, error: metadataResult.error || 'Failed to save metadata' }
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Load certificate with metadata from Vault
 */
export async function loadCertificateFromVault(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  path: string,
  key: string
): Promise<{ success: boolean; certificate?: CertificateItem; error?: string }> {
  try {
    const pathParts = path.split('/')
    const secretPath = pathParts.slice(1).join('/')
    
    // 1. Get metadata first (always available)
    const metadataResult = await vaultAPI.getMetadata(credentialId, secretPath)
    
    if (!metadataResult.success) {
      return { success: false, error: 'Failed to load metadata' }
    }
    
    const customMetadata = metadataResult.data?.custom_metadata || {}
    
    // 2. Try to get secret data (may not exist yet)
    let certData: any = undefined
    try {
      const secretResult = await vaultAPI.getSecret(credentialId, secretPath)
      if (secretResult.success && secretResult.data?.data?.data) {
        certData = secretResult.data.data.data[key]
      }
    } catch (err) {
      // Secret doesn't exist yet, that's okay
    }
    
    // 3. Reconstruct certificate from metadata
    const certificate = buildCertificateFromMetadata(
      customMetadata,
      path,
      key,
      certData
    )
    
    return { success: true, certificate }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Find all certificates signed by a specific CA
 */
export async function findCertificatesSignedBy(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  caPath: string,
  caKey: string,
  basePath: string = 'kv-v2/dev/org1/cai/certs'
): Promise<CertificateItem[]> {
  const results: CertificateItem[] = []
  
  try {
    // List all secrets recursively
    const allPaths = await listAllSecretsRecursive(vaultAPI, credentialId, basePath)
    
    for (const secretPath of allPaths) {
      const metadataResult = await vaultAPI.getMetadata(credentialId, secretPath)
      
      if (!metadataResult.success) continue
      
      const metadata = metadataResult.data?.custom_metadata || {}
      
      // Check relationships for matching CA
      const relCount = parseInt(metadata.relationship_count || '0')
      for (let i = 0; i < relCount; i++) {
        const relType = metadata[`relationship_${i}_type`]
        const targetPath = metadata[`relationship_${i}_target_path`]
        const targetKey = metadata[`relationship_${i}_target_key`]
        
        if (relType === 'signs' && targetPath === caPath && targetKey === caKey) {
          const cert = buildCertificateFromMetadata(
            metadata,
            `kv-v2/${secretPath}`,
            metadata.cert_key || '',
            undefined
          )
          results.push(cert)
          break
        }
      }
    }
  } catch (error) {
    console.error('Error finding certificates:', error)
  }
  
  return results
}

/**
 * Get all certificates in a chain
 */
export async function getCertificateChain(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  chainId: string,
  basePath: string = 'kv-v2/dev/org1/cai/certs'
): Promise<CertificateItem[]> {
  const results: CertificateItem[] = []
  
  try {
    const allPaths = await listAllSecretsRecursive(vaultAPI, credentialId, basePath)
    
    for (const secretPath of allPaths) {
      const metadataResult = await vaultAPI.getMetadata(credentialId, secretPath)
      
      if (!metadataResult.success) continue
      
      const metadata = metadataResult.data?.custom_metadata || {}
      const chainIds = metadata.chain_ids?.split(',') || []
      
      if (chainIds.includes(chainId)) {
        const cert = buildCertificateFromMetadata(
          metadata,
          `kv-v2/${secretPath}`,
          metadata.cert_key || '',
          undefined
        )
        results.push(cert)
      }
    }
  } catch (error) {
    console.error('Error getting certificate chain:', error)
  }
  
  return results
}

// Helper: Build metadata object from certificate
function buildMetadataFromCertificate(
  cert: CertificateItem,
  environment: string
): Record<string, string> {
  const metadata: Record<string, string> = {
    cert_type: cert.type,
    cert_name: cert.name,
    cert_key: cert.vaultRef.key,
    environment: environment,
    updated_at: new Date().toISOString()
  }
  
  // Add relationships
  if (cert.relationships && cert.relationships.length > 0) {
    metadata.relationship_count = cert.relationships.length.toString()
    
    cert.relationships.forEach((rel, index) => {
      metadata[`relationship_${index}_type`] = rel.type
      metadata[`relationship_${index}_target_path`] = rel.targetPath
      metadata[`relationship_${index}_target_key`] = rel.targetKey
    })
  } else {
    metadata.relationship_count = '0'
  }
  
  return metadata
}

// Helper: Build certificate object from metadata
function buildCertificateFromMetadata(
  metadata: Record<string, string>,
  path: string,
  key: string,
  certData?: any
): CertificateItem {
  // Reconstruct relationships
  const relationships: CertificateRelationship[] = []
  const relCount = parseInt(metadata.relationship_count || '0')
  
  for (let i = 0; i < relCount; i++) {
    const type = metadata[`relationship_${i}_type`]
    const targetPath = metadata[`relationship_${i}_target_path`]
    const targetKey = metadata[`relationship_${i}_target_key`]
    
    if (type && targetPath && targetKey) {
      relationships.push({
        type: type as 'signs' | 'trusts' | 'validates',
        targetPath,
        targetKey
      })
    }
  }
  
  return {
    name: metadata.cert_name || key,
    type: (metadata.cert_type || 'server') as CertificateType,
    vaultRef: {
      path,
      key: metadata.cert_key || key
    },
    data: certData ? {
      thumbprint: certData.thumbprint || '',
      definition: certData.definition || '',
      password: certData.password || ''
    } : undefined,
    relationships: relationships.length > 0 ? relationships : undefined
  }
}

/**
 * Safely update metadata by merging with existing values
 * This prevents accidentally overwriting existing metadata fields
 */
export async function updateMetadataSafely(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  path: string,
  updates: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    const pathParts = path.split('/')
    const secretPath = pathParts.slice(1).join('/')
    
    // 1. Get existing metadata
    const existingResult = await vaultAPI.getMetadata(credentialId, secretPath)
    const existingMetadata = existingResult.data?.custom_metadata || {}
    
    // 2. Merge with updates
    const mergedMetadata = {
      ...existingMetadata,
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    // 3. Write merged metadata
    const result = await vaultAPI.putMetadata(credentialId, secretPath, mergedMetadata)
    
    return { success: result.success, error: result.error }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update certificate relationships without touching certificate data
 */
export async function updateCertificateRelationships(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  path: string,
  relationships: CertificateRelationship[]
): Promise<{ success: boolean; error?: string }> {
  const updates: Record<string, string> = {
    relationship_count: relationships.length.toString()
  }
  
  relationships.forEach((rel, index) => {
    updates[`relationship_${index}_type`] = rel.type
    updates[`relationship_${index}_target_path`] = rel.targetPath
    updates[`relationship_${index}_target_key`] = rel.targetKey
  })
  
  return updateMetadataSafely(vaultAPI, credentialId, path, updates)
}

/**
 * Add a certificate to a chain (updates metadata only)
 */
export async function addCertificateToChain(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  path: string,
  chainId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pathParts = path.split('/')
    const secretPath = pathParts.slice(1).join('/')
    
    // Get existing metadata
    const existingResult = await vaultAPI.getMetadata(credentialId, secretPath)
    const existingMetadata = existingResult.data?.custom_metadata || {}
    
    // Get existing chain IDs
    const existingChains = existingMetadata.chain_ids?.split(',').filter(Boolean) || []
    
    // Add new chain if not already present
    if (!existingChains.includes(chainId)) {
      existingChains.push(chainId)
    }
    
    return updateMetadataSafely(vaultAPI, credentialId, path, {
      chain_ids: existingChains.join(',')
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Remove a certificate from a chain (updates metadata only)
 */
export async function removeCertificateFromChain(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  path: string,
  chainId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const pathParts = path.split('/')
    const secretPath = pathParts.slice(1).join('/')
    
    // Get existing metadata
    const existingResult = await vaultAPI.getMetadata(credentialId, secretPath)
    const existingMetadata = existingResult.data?.custom_metadata || {}
    
    // Get existing chain IDs and remove the specified one
    const existingChains = existingMetadata.chain_ids?.split(',').filter(Boolean) || []
    const updatedChains = existingChains.filter((id: string) => id !== chainId)
    
    return updateMetadataSafely(vaultAPI, credentialId, path, {
      chain_ids: updatedChains.join(',')
    })
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper: List all secrets recursively
async function listAllSecretsRecursive(
  vaultAPI: VaultMetadataAPI,
  credentialId: string,
  basePath: string
): Promise<string[]> {
  const results: string[] = []
  
  try {
    const pathParts = basePath.split('/')
    const listPath = pathParts.slice(1).join('/')
    
    const listResult = await vaultAPI.listSecrets(credentialId, listPath)
    
    if (listResult.success && listResult.data?.data?.keys) {
      const keys = listResult.data.data.keys as string[]
      
      for (const key of keys) {
        if (key.endsWith('/')) {
          // It's a folder, recurse
          const subResults = await listAllSecretsRecursive(
            vaultAPI,
            credentialId,
            `${basePath}/${key.slice(0, -1)}`
          )
          results.push(...subResults)
        } else {
          // It's a secret
          results.push(`${listPath}/${key}`)
        }
      }
    }
  } catch (error) {
    console.error('Error listing secrets:', error)
  }
  
  return results
}
