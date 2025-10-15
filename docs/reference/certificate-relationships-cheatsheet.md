# Certificate Relationships - Quick Cheat Sheet

## The Three Types

### 🔐 signs
**"I am signed by..."**

```
My Certificate
    ↓ signed by
Certificate Authority
```

**Use for:** CA hierarchy, certificate issuance

---

### ✅ trusts
**"I trust..."**

```
My Certificate
    ↓ trusts
Root CA / Authority
```

**Use for:** Defining trusted CAs, client validation

---

### 🔑 validates
**"I authenticate to..."**

```
Client Certificate
    ↓ validates to
Server Certificate
```

**Use for:** mTLS, client authentication, service-to-service

---

## Quick Examples

### Simple HTTPS Server
```yaml
- name: WebServer
  type: server
  relationships:
    - type: signs
      targetKey: LetsEncrypt
```

### mTLS Server
```yaml
- name: APIServer
  type: server
  relationships:
    - type: signs
      targetKey: CompanyCA
    - type: trusts
      targetKey: CompanyCA  # Trust for client validation
```

### mTLS Client
```yaml
- name: ServiceClient
  type: client
  relationships:
    - type: signs
      targetKey: CompanyCA
    - type: validates
      targetKey: APIServer  # Authenticate to this server
```

---

## Visual Guide

```
┌─────────────┐
│   RootCA    │  (No relationships - top of chain)
└──────┬──────┘
       │ signs
       ↓
┌─────────────┐
│ Intermediate│
└──────┬──────┘
       │ signs
       ↓
┌─────────────┐     ┌─────────────┐
│   Server    │◄────│   Client    │
│             │     │             │
│ trusts: CA  │     │ validates:  │
│             │     │   Server    │
└─────────────┘     └─────────────┘
```

---

## When to Use Each

| Scenario | signs | trusts | validates |
|----------|-------|--------|-----------|
| Basic HTTPS | ✅ | ❌ | ❌ |
| Server with client auth | ✅ | ✅ | ❌ |
| Client certificate | ✅ | ❌ | ✅ |
| Intermediate CA | ✅ | ❌ | ❌ |
| Root CA | ❌ | ❌ | ❌ |

---

## Common Mistakes

### ❌ Wrong
```yaml
# Client cert without validates
- name: Client
  type: client
  relationships:
    - type: signs
      targetKey: CA
  # Missing: validates relationship!
```

### ✅ Right
```yaml
- name: Client
  type: client
  relationships:
    - type: signs
      targetKey: CA
    - type: validates
      targetKey: Server  # Added!
```

---

## Remember

- **signs** = Who issued me
- **trusts** = Who I trust
- **validates** = Who I authenticate to

📖 **Full guide:** `docs/certificate-relationships-explained.md`
