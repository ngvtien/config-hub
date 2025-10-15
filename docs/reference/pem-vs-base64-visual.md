# PEM vs Base64: Visual Comparison

## Side-by-Side Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│  PEM Format (What you should use)                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  -----BEGIN CERTIFICATE-----                    ← Header            │
│  MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqG    ← Base64 (64 chars)  │
│  SIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYD    ← Base64 (64 chars)  │
│  VQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRl    ← Base64 (64 chars)  │
│  cm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTcwODIz    ← Base64 (64 chars)  │
│  MTUxNjQ3WhcNMTgwODIzMTUxNjQ3WjBFMQswCQYD    ← Base64 (64 chars)  │
│  -----END CERTIFICATE-----                      ← Footer            │
│                                                                      │
│  ✅ Standard format                                                 │
│  ✅ Recognized by all tools                                         │
│  ✅ Human-readable headers                                          │
│  ✅ Can contain multiple certs (chain)                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Raw Base64 (Not recommended for certificates)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV │
│  BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX │
│  aWRnaXRzIFB0eSBMdGQwHhcNMTcwODIzMTUxNjQ3WhcNMTgwODIzMTUxNjQ3WjBF │
│  MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50 │
│                                                                      │
│  ❌ No headers                                                      │
│  ❌ Requires conversion before use                                  │
│  ❌ Hard to identify type                                           │
│  ❌ Not standard for certificates                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What's Inside?

### Both contain the SAME data, just different packaging:

```
┌──────────────────────────────────────────────────────────────┐
│  Binary Certificate Data (DER format)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Version: 3                                            │ │
│  │  Serial Number: A2:F4:50:6F:A6:44:A2:B3               │ │
│  │  Issuer: CN=Example CA                                │ │
│  │  Subject: CN=example.com                              │ │
│  │  Public Key: RSA 2048 bits                            │ │
│  │  Signature: SHA256withRSA                             │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            ↓
                    Base64 Encode
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Base64 String                                               │
│  MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqGSIb3DQEBC...   │
└──────────────────────────────────────────────────────────────┘
                            ↓
                    Add PEM Headers
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  PEM Format                                                  │
│  -----BEGIN CERTIFICATE-----                                │
│  MIIDXTCCAkWgAwIBAgIJAKL0UG+mRKKzMA0GCSqG             │
│  SIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYD             │
│  -----END CERTIFICATE-----                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Real Example

### Server Certificate in PEM Format
```
-----BEGIN CERTIFICATE-----
MIIFazCCBFOgAwIBAgISA5PqFqKqKqKqKqKqKqKqKqKqMA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
EwJSMzAeFw0yNDAxMTUwMDAwMDBaFw0yNDA0MTQyMzU5NTlaMBkxFzAVBgNVBAMT
DmV4YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw6Gv
PYKvKXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXK
vXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXK
-----END CERTIFICATE-----
```

### Same Certificate as Raw Base64
```
MIIFazCCBFOgAwIBAgISA5PqFqKqKqKqKqKqKqKqKqKqMA0GCSqGSIb3DQEBCwUAMDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQDEwJSMzAeFw0yNDAxMTUwMDAwMDBaFw0yNDA0MTQyMzU5NTlaMBkxFzAVBgNVBAMTDmV4YW1wbGUuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAw6GvPYKvKXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXKvXXK
```

**They contain the EXACT same certificate data!**

---

## Certificate Chain Example

### PEM Chain (Multiple Certificates)
```
-----BEGIN CERTIFICATE-----
[Server Certificate]
MIIFazCCBFOgAwIBAgISA5PqFqKqKqKqKqKqKqKqKqKqMA0GCSqGSIb3DQEBCwUA
...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
[Intermediate CA Certificate]
MIIFFjCCAv6gAwIBAgIRAJErCErPDBinU/bWLiWnX1owDQYJKoZIhvcNAQELBQAw
...
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
[Root CA Certificate]
MIIFYDCCBEigAwIBAgIQQAF3ITfU6UK47naqPGQKtzANBgkqhkiG9w0BAQsFADA/
...
-----END CERTIFICATE-----
```

**Easy to identify and separate!**

### Base64 Chain (Difficult to parse)
```
MIIFazCCBFOgAwIBAgISA5PqFqKqKqKqKqKqKqKqKqKqMA0GCSqGSIb3DQEBCwUA...MIIFFjCCAv6gAwIBAgIRAJErCErPDBinU/bWLiWnX1owDQYJKoZIhvcNAQELBQAw...MIIFYDCCBEigAwIBAgIQQAF3ITfU6UK47naqPGQKtzANBgkqhkiG9w0BAQsFADA/...
```

**Hard to tell where one cert ends and another begins!**

---

## Tool Compatibility

### PEM Format ✅
```bash
# OpenSSL
openssl x509 -in cert.pem -text -noout

# Java keytool
keytool -printcert -file cert.pem

# Node.js
const cert = fs.readFileSync('cert.pem', 'utf8')
const x509 = new crypto.X509Certificate(cert)

# Python
from cryptography import x509
cert = x509.load_pem_x509_certificate(pem_data)

# cURL
curl --cert cert.pem https://example.com
```

### Raw Base64 ❌
```bash
# Requires conversion first!
echo "MIIFazCCBFOg..." | base64 -d > cert.der
openssl x509 -in cert.der -inform DER -text -noout
```

---

## Storage Comparison

### In Vault (PEM - Recommended)
```yaml
kv-v2/dev/certs/servers/server1:
  thumbprint: "ABC123"
  definition: |
    -----BEGIN CERTIFICATE-----
    MIIFazCCBFOgAwIBAgISA5PqFqKqKqKqKqKqKqKqKqKqMA0GCSqGSIb3DQEBCwUA
    MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
    -----END CERTIFICATE-----
  password: "secret"
```

### In Vault (Base64 - Not Recommended)
```yaml
kv-v2/dev/certs/servers/server1:
  thumbprint: "ABC123"
  definition: "MIIFazCCBFOgAwIBAgISA5PqFqKqKqKqKqKqKqKqKqKqMA0GCSqGSIb3DQEBCwUAMDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD"
  format: "base64"  # Need to track format!
  password: "secret"
```

---

## Summary Table

| Aspect | PEM | Base64 |
|--------|-----|--------|
| **Headers** | ✅ `-----BEGIN/END-----` | ❌ None |
| **Line Breaks** | ✅ Every 64 chars | ❌ Continuous |
| **Tool Support** | ✅ Universal | ⚠️ Requires conversion |
| **Human Readable** | ✅ Yes | ❌ No |
| **Type Identification** | ✅ Easy | ❌ Difficult |
| **Certificate Chains** | ✅ Easy to parse | ❌ Hard to separate |
| **Standard** | ✅ RFC 7468 | ❌ No standard |
| **Use in Vault** | ✅ Recommended | ❌ Not recommended |

---

## Recommendation

### ✅ Always Use PEM Format

```typescript
// Good ✅
const cert: CertificateData = {
  thumbprint: "ABC123",
  definition: `-----BEGIN CERTIFICATE-----
MIIFazCCBFOgAwIBAgISA5PqFqKqKqKqKqKqKqKqKqKqMA0GCSqGSIb3DQEBCwUA
MDIxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQswCQYDVQQD
-----END CERTIFICATE-----`,
  password: "secret"
}

// Bad ❌
const cert: CertificateData = {
  thumbprint: "ABC123",
  definition: "MIIFazCCBFOgAwIBAgISA5PqFqKqKqKqKqKqKqKqKqKqMA0GCSqGSIb3DQEBCwUA...",
  password: "secret"
}
```

**PEM = Base64 + Headers + Line Breaks = Standard Certificate Format** 🎯
