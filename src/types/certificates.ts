// Certificate types and structures

export type CertificateType = 'server' | 'client' | 'root-ca' | 'intermediate-ca'

export interface CertificateData {
  thumbprint: string
  definition: string // PEM-encoded certificate (includes -----BEGIN CERTIFICATE----- headers)
  password?: string
  format?: 'pem' | 'base64' | 'der' // Optional: specify format (default: pem)
}

export interface CertificateReference {
  path: string // Vault path
  key: string // Certificate key name
  type: CertificateType
}

export interface CertificateRelationship {
  type: 'signs' | 'trusts' | 'validates'
  targetPath: string
  targetKey: string
}

export interface CertificateItem {
  name: string // Display name
  type: CertificateType
  vaultRef: {
    path: string
    key: string
  }
  data?: CertificateData
  relationships?: CertificateRelationship[]
}

export interface CertificateChain {
  server?: CertificateReference
  intermediate?: CertificateReference[]
  rootCA?: CertificateReference
  client?: CertificateReference
}

export interface CertificateFormData {
  certificates: CertificateItem[]
  chains?: Record<string, CertificateChain>
}

// Helper functions for certificate format handling

/**
 * Check if a string is in PEM format
 */
export function isPemFormat(content: string): boolean {
  const pemRegex = /-----BEGIN [A-Z\s]+-----[\s\S]+-----END [A-Z\s]+-----/
  return pemRegex.test(content)
}

/**
 * Get the type of PEM certificate (CERTIFICATE, PRIVATE KEY, etc.)
 */
export function getPemType(pem: string): string | null {
  const match = pem.match(/-----BEGIN ([A-Z\s]+)-----/)
  return match ? match[1] : null
}

/**
 * Convert Base64 to PEM format
 */
export function base64ToPem(
  base64: string,
  type: 'CERTIFICATE' | 'PRIVATE KEY' | 'PUBLIC KEY' | 'CERTIFICATE REQUEST' = 'CERTIFICATE'
): string {
  // Remove any whitespace
  const cleaned = base64.replace(/\s/g, '')
  
  // Add line breaks every 64 characters
  const formatted = cleaned.match(/.{1,64}/g)?.join('\n') || cleaned
  
  return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`
}

/**
 * Convert PEM to Base64 (remove headers and whitespace)
 */
export function pemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN [A-Z\s]+-----/g, '')
    .replace(/-----END [A-Z\s]+-----/g, '')
    .replace(/\s/g, '')
}

/**
 * Ensure certificate is in PEM format
 * If already PEM, return as-is. If Base64, convert to PEM.
 */
export function ensurePemFormat(
  cert: string,
  type: 'CERTIFICATE' | 'PRIVATE KEY' | 'PUBLIC KEY' = 'CERTIFICATE'
): string {
  // Already PEM?
  if (isPemFormat(cert)) {
    return cert
  }
  
  // Convert Base64 to PEM
  return base64ToPem(cert, type)
}

/**
 * Extract multiple certificates from a PEM chain
 */
export function extractCertificatesFromChain(chain: string): string[] {
  const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g
  return chain.match(certRegex) || []
}

/**
 * Validate PEM certificate format
 */
export function validatePemCertificate(pem: string): { valid: boolean; error?: string } {
  if (!pem || typeof pem !== 'string') {
    return { valid: false, error: 'Certificate is empty or not a string' }
  }
  
  if (!isPemFormat(pem)) {
    return { valid: false, error: 'Not in PEM format (missing headers)' }
  }
  
  const type = getPemType(pem)
  if (!type) {
    return { valid: false, error: 'Could not determine certificate type' }
  }
  
  // Check for matching end header
  const beginHeader = `-----BEGIN ${type}-----`
  const endHeader = `-----END ${type}-----`
  
  if (!pem.includes(beginHeader) || !pem.includes(endHeader)) {
    return { valid: false, error: 'Mismatched or missing headers' }
  }
  
  return { valid: true }
}
