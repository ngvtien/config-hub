# Certificate Relationships Explained

## Overview

Certificate relationships define how certificates interact with each other in a PKI (Public Key Infrastructure). Understanding these relationships is crucial for managing certificate chains and trust hierarchies.

---

## The Three Relationship Types

### 1. **signs** (Signing Relationship)

**Meaning:** "This certificate is signed by another certificate"

**Direction:** Child → Parent (points to the signer)

**Use Case:** Establishing the certificate authority hierarchy

#### Example:
```yaml
- name: ServerCertificate
  type: server
  relationships:
    - type: signs
      targetPath: kv-v2/dev/certs/intermediates
      targetKey: IntermediateCA
```

**Translation:** "ServerCertificate is signed by IntermediateCA"

#### Visual:
```
┌─────────────────────┐
│  ServerCertificate  │
│  (server)           │
└──────────┬──────────┘
           │ signs (signed by)
           ↓
┌─────────────────────┐
│  IntermediateCA     │
│  (intermediate-ca)  │
└──────────┬──────────┘
           │ signs (signed by)
           ↓
┌─────────────────────┐
│  RootCA             │
│  (root-ca)          │
└─────────────────────┘
```

#### Real-World Analogy:
Like a diploma signed by a university dean. The diploma (certificate) is signed by the dean (CA), proving its authenticity.

---

### 2. **trusts** (Trust Relationship)

**Meaning:** "This certificate trusts another certificate as an authority"

**Direction:** Certificate → Trusted Authority

**Use Case:** Defining which root CAs or intermediate CAs are trusted

#### Example:
```yaml
- name: ServerCertificate
  type: server
  relationships:
    - type: trusts
      targetPath: kv-v2/dev/certs/roots
      targetKey: RootCA
```

**Translation:** "ServerCertificate trusts RootCA as a root authority"

#### Visual:
```
┌─────────────────────┐
│  ServerCertificate  │
│  (server)           │
└──────────┬──────────┘
           │ trusts
           ↓
┌─────────────────────┐
│  RootCA             │
│  (root-ca)          │
│  [Trusted Root]     │
└─────────────────────┘
```

#### Real-World Analogy:
Like trusting a government-issued ID. You trust the government (root CA) as an authority, so you trust IDs (certificates) issued by them.

#### Common Use Cases:
- Server trusts a root CA for client certificate validation
- Application trusts specific intermediate CAs
- Service trusts a corporate root CA

---

### 3. **validates** (Validation Relationship)

**Meaning:** "This certificate is used to validate another certificate"

**Direction:** Validator → Target (what it validates)

**Use Case:** Mutual TLS (mTLS), client authentication, peer validation

#### Example:
```yaml
- name: ClientCertificate
  type: client
  relationships:
    - type: validates
      targetPath: kv-v2/dev/certs/servers
      targetKey: ServerCertificate
```

**Translation:** "ClientCertificate is used to validate connections to ServerCertificate"

#### Visual:
```
┌─────────────────────┐
│  ClientCertificate  │
│  (client)           │
└──────────┬──────────┘
           │ validates
           ↓
┌─────────────────────┐
│  ServerCertificate  │
│  (server)           │
└─────────────────────┘
```

#### Real-World Analogy:
Like a security badge that validates your access to a building. The badge (client cert) validates your identity to the building's security system (server).

#### Common Use Cases:
- Client certificate validates to a server (mTLS)
- Service-to-service authentication
- API authentication with client certificates

---

## Comparison Table

| Relationship | Direction | Purpose | Example |
|--------------|-----------|---------|---------|
| **signs** | Child → Signer | Certificate authority hierarchy | "My cert is signed by CA" |
| **trusts** | Cert → Authority | Trust establishment | "I trust this root CA" |
| **validates** | Validator → Target | Authentication/Authorization | "My client cert validates to this server" |

---

## Complete Example: Production Setup

```yaml
certificates:
  # Root CA
  - name: CorporateRootCA
    type: root-ca
    vaultRef:
      path: kv-v2/prod/certs/roots
      key: CorporateRootCA
    # Root CA has no relationships (it's the top of the chain)

  # Intermediate CA
  - name: DepartmentIntermediateCA
    type: intermediate-ca
    vaultRef:
      path: kv-v2/prod/certs/intermediates
      key: DepartmentIntermediateCA
    relationships:
      - type: signs
        targetPath: kv-v2/prod/certs/roots
        targetKey: CorporateRootCA
        # "I am signed by CorporateRootCA"

  # Server Certificate
  - name: APIServerCertificate
    type: server
    vaultRef:
      path: kv-v2/prod/certs/servers
      key: APIServerCertificate
    relationships:
      - type: signs
        targetPath: kv-v2/prod/certs/intermediates
        targetKey: DepartmentIntermediateCA
        # "I am signed by DepartmentIntermediateCA"
      - type: trusts
        targetPath: kv-v2/prod/certs/roots
        targetKey: CorporateRootCA
        # "I trust CorporateRootCA for client validation"

  # Client Certificate
  - name: ServiceAClientCertificate
    type: client
    vaultRef:
      path: kv-v2/prod/certs/clients
      key: ServiceAClientCertificate
    relationships:
      - type: signs
        targetPath: kv-v2/prod/certs/intermediates
        targetKey: DepartmentIntermediateCA
        # "I am signed by DepartmentIntermediateCA"
      - type: validates
        targetPath: kv-v2/prod/certs/servers
        targetKey: APIServerCertificate
        # "I use this to authenticate to APIServerCertificate"
```

### Visual Representation:
```
┌──────────────────────────────────────────────────────────────┐
│                     CorporateRootCA                          │
│                     (root-ca)                                │
│                     [Top of Trust Chain]                     │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ signs (signed by)
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                DepartmentIntermediateCA                      │
│                (intermediate-ca)                             │
└────────────┬───────────────────────────────┬─────────────────┘
             │                               │
             │ signs                         │ signs
             ↓                               ↓
┌─────────────────────────┐    ┌─────────────────────────────┐
│  APIServerCertificate   │    │ ServiceAClientCertificate   │
│  (server)               │    │ (client)                    │
│                         │◄───│                             │
│  trusts: RootCA         │    │ validates: APIServer        │
└─────────────────────────┘    └─────────────────────────────┘
                                         validates
```

---

## Use Case Scenarios

### Scenario 1: Simple HTTPS Server

```yaml
- name: WebServerCert
  type: server
  relationships:
    - type: signs
      targetPath: kv-v2/prod/certs/ca
      targetKey: LetsEncryptCA
```

**What it means:** Web server certificate signed by Let's Encrypt CA

**No trusts or validates needed** - just basic HTTPS

---

### Scenario 2: Mutual TLS (mTLS)

```yaml
# Server side
- name: APIServerCert
  type: server
  relationships:
    - type: signs
      targetPath: kv-v2/prod/certs/ca
      targetKey: CompanyCA
    - type: trusts
      targetPath: kv-v2/prod/certs/ca
      targetKey: CompanyCA
      # Server trusts CompanyCA to validate client certs

# Client side
- name: ServiceClientCert
  type: client
  relationships:
    - type: signs
      targetPath: kv-v2/prod/certs/ca
      targetKey: CompanyCA
    - type: validates
      targetPath: kv-v2/prod/certs/servers
      targetKey: APIServerCert
      # Client uses this cert to authenticate to server
```

**What it means:** Both server and client authenticate each other

---

### Scenario 3: Multi-Tier CA Hierarchy

```yaml
# Root CA (self-signed)
- name: RootCA
  type: root-ca
  # No relationships

# Intermediate CA 1
- name: IntermediateCA1
  type: intermediate-ca
  relationships:
    - type: signs
      targetPath: kv-v2/prod/certs/roots
      targetKey: RootCA

# Intermediate CA 2 (cross-signed)
- name: IntermediateCA2
  type: intermediate-ca
  relationships:
    - type: signs
      targetPath: kv-v2/prod/certs/intermediates
      targetKey: IntermediateCA1
      # Signed by another intermediate

# Server Certificate
- name: ServerCert
  type: server
  relationships:
    - type: signs
      targetPath: kv-v2/prod/certs/intermediates
      targetKey: IntermediateCA2
    - type: trusts
      targetPath: kv-v2/prod/certs/roots
      targetKey: RootCA
```

**What it means:** Complex hierarchy with multiple intermediate CAs

---

## Best Practices

### 1. Always Define "signs" Relationships
Every certificate (except root CAs) should have a `signs` relationship pointing to its issuer.

```yaml
✅ Good:
- name: MyCert
  relationships:
    - type: signs
      targetPath: kv-v2/prod/certs/ca
      targetKey: MyCA

❌ Bad:
- name: MyCert
  relationships: []  # Missing signing relationship
```

### 2. Use "trusts" for Client Validation
If your server validates client certificates, define which CAs it trusts.

```yaml
✅ Good:
- name: APIServer
  type: server
  relationships:
    - type: trusts
      targetPath: kv-v2/prod/certs/roots
      targetKey: ClientCA
      # Server trusts ClientCA for client cert validation
```

### 3. Use "validates" for Client Certificates
Client certificates should specify which servers they authenticate to.

```yaml
✅ Good:
- name: ServiceClient
  type: client
  relationships:
    - type: validates
      targetPath: kv-v2/prod/certs/servers
      targetKey: APIServer
      # This client cert is for authenticating to APIServer
```

### 4. Document Complex Relationships
For complex setups, add comments explaining the relationships.

```yaml
- name: MyCert
  relationships:
    - type: signs
      targetPath: kv-v2/prod/certs/ca
      targetKey: IntermediateCA
      # Signed by IntermediateCA for production use
    - type: trusts
      targetPath: kv-v2/prod/certs/roots
      targetKey: RootCA
      # Trusts RootCA for validating peer certificates
```

---

## Common Patterns

### Pattern 1: Standard Server Certificate
```yaml
relationships:
  - type: signs
    targetPath: kv-v2/prod/certs/ca
    targetKey: CA
```

### Pattern 2: mTLS Server
```yaml
relationships:
  - type: signs
    targetPath: kv-v2/prod/certs/ca
    targetKey: CA
  - type: trusts
    targetPath: kv-v2/prod/certs/ca
    targetKey: CA
```

### Pattern 3: mTLS Client
```yaml
relationships:
  - type: signs
    targetPath: kv-v2/prod/certs/ca
    targetKey: CA
  - type: validates
    targetPath: kv-v2/prod/certs/servers
    targetKey: ServerCert
```

### Pattern 4: Intermediate CA
```yaml
relationships:
  - type: signs
    targetPath: kv-v2/prod/certs/roots
    targetKey: RootCA
```

---

## Querying by Relationships

With Vault metadata, you can query certificates by their relationships:

```typescript
// Find all certificates signed by a specific CA
const certs = await findCertificatesSignedBy(
  vaultAPI,
  credId,
  'kv-v2/prod/certs/ca',
  'MyCA'
)

// Find all certificates that trust a specific root
const trustedCerts = await findCertificatesTrusting(
  vaultAPI,
  credId,
  'kv-v2/prod/certs/roots',
  'RootCA'
)

// Find all client certificates that validate to a server
const clientCerts = await findCertificatesValidating(
  vaultAPI,
  credId,
  'kv-v2/prod/certs/servers',
  'APIServer'
)
```

---

## Summary

| Relationship | Question It Answers | Typical Usage |
|--------------|---------------------|---------------|
| **signs** | "Who issued this certificate?" | All certificates (except root CAs) |
| **trusts** | "Which CAs do I trust?" | Servers validating clients, mTLS |
| **validates** | "What do I authenticate to?" | Client certificates, service-to-service |

### Quick Reference:
- **signs** = "I am signed by..."
- **trusts** = "I trust..."
- **validates** = "I authenticate to..."

---

## Need Help?

### Common Questions:

**Q: Can a certificate have multiple relationships?**
A: Yes! A certificate can have multiple relationships of different types.

**Q: Do I need all three types?**
A: No. Most certificates only need `signs`. Use `trusts` and `validates` for mTLS and client authentication.

**Q: Can I have multiple "signs" relationships?**
A: Technically yes (for cross-signed certificates), but typically a certificate has one issuer.

**Q: What if I don't define relationships?**
A: The certificate will still work, but you lose the ability to query and track certificate hierarchies.

---

## Examples in the UI

When you add a relationship in the Certificate Edit Modal:

1. **Type:** Choose `signs`, `trusts`, or `validates`
2. **Target Path:** The Vault path of the related certificate
3. **Target Key:** The key name of the related certificate

The UI will help you build these relationships visually! 🎯
