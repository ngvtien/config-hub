# Certificate Encoding Formats: PEM vs Base64

## TL;DR

**PEM = Base64 + Headers + Line Breaks**

- ✅ PEM is Base64-encoded with special headers
- ❌ Raw Base64 is just the encoded data without headers
- 🎯 For certificates, always use PEM format

---

## The Difference

### Raw Base64 (Just the encoding)
```
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTcwODIzMTUxNjQ3WhcNMTgwODIzMTUxNjQ3WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAw6GvPYKvKXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXK
```

### PEM Format (Base64 + Headers + Line Breaks)
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTcwODIzMTUxNjQ3WhcNMTgwODIzMTUxNjQ3WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAw6GvPYKvKXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXK
-----END CERTIFICATE-----
```

---

## Detailed Breakdown

### PEM (Privacy Enhanced Mail)

**Structure:**
```
-----BEGIN [TYPE]-----
[Base64-encoded data with line breaks every 64 characters]
-----END [TYPE]-----
```

**Types:**
- `-----BEGIN CERTIFICATE-----` - X.509 certificate
- `-----BEGIN PRIVATE KEY-----` - PKCS#8 private key
- `-----BEGIN RSA PRIVATE KEY-----` - PKCS#1 RSA private key
- `-----BEGIN PUBLIC KEY-----` - Public key
- `-----BEGIN CERTIFICATE REQUEST-----` - CSR (Certificate Signing Request)

**Characteristics:**
- ✅ Human-readable headers
- ✅ Line breaks every 64 characters
- ✅ Standardized format (RFC 7468)
- ✅ Can be easily identified
- ✅ Can contain multiple certificates (chain)

---

## Examples

### 1. PEM Certificate (What you should use)
```
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTcwODIzMTUxNjQ3WhcNMTgwODIzMTUxNjQ3WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAw6GvPYKvKXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXK
vXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXK
-----END CERTIFICATE-----
```

### 2. Raw Base64 (Not recommended for certificates)
```
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTcwODIzMTUxNjQ3WhcNMTgwODIzMTUxNjQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw6GvPYKvKXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXK
```

### 3. DER (Binary format - not Base64)
```
30 82 03 5D 30 82 02 45 A0 03 02 01 02 02 09 00
A2 F4 50 6F A6 44 A2 B3 30 0D 06 09 2A 86 48 86
F7 0D 01 01 0B 05 00 30 45 31 0B 30 09 06 03 55
...
```

---

## Conversion Examples

### PEM to Base64 (Remove headers)
```typescript
function pemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN [A-Z\s]+-----/g, '')
    .replace(/-----END [A-Z\s]+-----/g, '')
    .replace(/\s/g, '') // Remove all whitespace
}

// Example
const pem = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
-----END CERTIFICATE-----`

const base64 = pemToBase64(pem)
// Result: "MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX"
```

### Base64 to PEM (Add headers)
```typescript
function base64ToPem(base64: string, type: 'CERTIFICATE' | 'PRIVATE KEY' | 'PUBLIC KEY'): string {
  // Add line breaks every 64 characters
  const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64
  
  return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`
}

// Example
const base64 = "MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX"

const pem = base64ToPem(base64, 'CERTIFICATE')
// Result:
// -----BEGIN CERTIFICATE-----
// MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJ
// BgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbn
// Rlcm5ldCBX
// -----END CERTIFICATE-----
```

---

## Certificate Chain (Multiple PEM blocks)

```
-----BEGIN CERTIFICATE-----
[Server Certificate - Base64 encoded]
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
[Intermediate CA Certificate - Base64 encoded]
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
[Root CA Certificate - Base64 encoded]
-----END CERTIFICATE-----
```

---

## What to Store in Vault

### ✅ Recommended: Store PEM Format
```yaml
definition: |
  -----BEGIN CERTIFICATE-----
  MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
  BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
  aWRnaXRzIFB0eSBMdGQwHhcNMTcwODIzMTUxNjQ3WhcNMTgwODIzMTUxNjQ3WjBF
  -----END CERTIFICATE-----
```

**Why PEM?**
- ✅ Standard format recognized by all tools
- ✅ Can be used directly (no conversion needed)
- ✅ Human-readable headers
- ✅ Easy to validate
- ✅ Supports certificate chains

### ⚠️ Alternative: Store Base64 (Not recommended)
```yaml
definition: "MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX"
format: "base64"
```

**Issues:**
- ❌ Requires conversion before use
- ❌ No standard headers
- ❌ Hard to identify type
- ❌ Can't contain chains easily

---

## Validation

### Validate PEM Format
```typescript
function isPemFormat(content: string): boolean {
  const pemRegex = /-----BEGIN [A-Z\s]+-----[\s\S]+-----END [A-Z\s]+-----/
  return pemRegex.test(content)
}

function getCertificateType(pem: string): string | null {
  const match = pem.match(/-----BEGIN ([A-Z\s]+)-----/)
  return match ? match[1] : null
}

// Examples
isPemFormat('-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----') // true
isPemFormat('MIIDXTCCAkWgAwIBAgIJ...') // false

getCertificateType('-----BEGIN CERTIFICATE-----\n...') // "CERTIFICATE"
getCertificateType('-----BEGIN PRIVATE KEY-----\n...') // "PRIVATE KEY"
```

### Extract Multiple Certificates from Chain
```typescript
function extractCertificatesFromChain(chain: string): string[] {
  const certRegex = /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g
  return chain.match(certRegex) || []
}

// Example
const chain = `
-----BEGIN CERTIFICATE-----
[Server Cert]
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
[Intermediate Cert]
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
[Root Cert]
-----END CERTIFICATE-----
`

const certs = extractCertificatesFromChain(chain)
// Result: Array of 3 PEM certificates
```

---

## Common Formats Comparison

| Format | Encoding | Headers | Line Breaks | Use Case |
|--------|----------|---------|-------------|----------|
| **PEM** | Base64 | ✅ Yes | ✅ Every 64 chars | ✅ **Recommended** |
| **DER** | Binary | ❌ No | ❌ No | API/programmatic |
| **Base64** | Base64 | ❌ No | ❌ No | Data transmission |
| **PKCS#7** | Base64 | ✅ Yes | ✅ Yes | Certificate chains |
| **PKCS#12** | Binary | ❌ No | ❌ No | Password-protected |

---

## Updated Type Definition

```typescript
// src/types/certificates.ts

export interface CertificateData {
  thumbprint: string
  definition: string // PEM-encoded certificate (includes headers)
  password?: string
  format?: 'pem' | 'base64' | 'der' // Optional: specify format
}

// Helper to ensure PEM format
export function ensurePemFormat(cert: string, type: 'CERTIFICATE' | 'PRIVATE KEY' = 'CERTIFICATE'): string {
  // Already PEM?
  if (cert.includes('-----BEGIN')) {
    return cert
  }
  
  // Convert Base64 to PEM
  const formatted = cert.match(/.{1,64}/g)?.join('\n') || cert
  return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`
}
```

---

## Best Practices

### ✅ DO
- ✅ Store certificates in PEM format
- ✅ Include headers (`-----BEGIN CERTIFICATE-----`)
- ✅ Use 64-character line breaks
- ✅ Validate format before storing
- ✅ Support certificate chains

### ❌ DON'T
- ❌ Store raw Base64 without headers
- ❌ Remove line breaks
- ❌ Mix formats
- ❌ Store binary DER in text fields

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│  PEM Format (Recommended)                                   │
├─────────────────────────────────────────────────────────────┤
│  -----BEGIN CERTIFICATE-----                                │
│  MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBC  │ ← Base64
│  wUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0Y  │ ← 64 chars/line
│  -----END CERTIFICATE-----                                  │
│                                                             │
│  = Base64 encoding + Headers + Line breaks                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Raw Base64 (Not Recommended)                               │
├─────────────────────────────────────────────────────────────┤
│  MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBC  │
│  wUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0Y  │
│                                                             │
│  = Just Base64 encoding (no headers, no standard format)   │
└─────────────────────────────────────────────────────────────┘
```

**For your certificate management system: Always use PEM format!** 🎯
