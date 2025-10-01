# Service Logos

This directory contains SVG logos for various services integrated with Config Hub.

## Available Logos

### **Config Hub (Main App)**
- `../config-hub-logo-light.svg` - Full logo for light theme
- `../config-hub-logo-dark.svg` - Full logo for dark theme  
- `../config-hub-monogram-light.svg` - Compact logo for light theme
- `../config-hub-monogram-dark.svg` - Compact logo for dark theme

### **Integrated Services**
- `helm-logo.svg` - Helm package manager (theme-aware ship's wheel design)
- `argocd-logo.svg` - ArgoCD continuous deployment (theme-aware navigation design)
- `vault-logo.svg` - HashiCorp Vault secrets management (theme-aware vault/safe design)
- `git-logo.svg` - Git version control (theme-aware branch design)
- `security-logo.svg` - Security/user management (theme-aware shield with checkmark)

## Usage

### **In React Components**
```jsx
// Service-specific logos
<img src="/logos/helm-logo.svg" alt="Helm" className="w-6 h-6" />
<img src="/logos/argocd-logo.svg" alt="ArgoCD" className="w-6 h-6" />
<img src="/logos/vault-logo.svg" alt="Vault" className="w-6 h-6" />
<img src="/logos/git-logo.svg" alt="Git" className="w-6 h-6" />
<img src="/logos/security-logo.svg" alt="Security" className="w-6 h-6" />

// Theme-aware Config Hub logos
<img src="/config-hub-logo-light.svg" className="w-8 h-8 dark:hidden" />
<img src="/config-hub-logo-dark.svg" className="w-8 h-8 hidden dark:block" />
```

### **Common Sizes**
- **Small icons**: 16px (w-4 h-4)
- **Standard icons**: 24px (w-6 h-6)  
- **Sidebar logos**: 32px (w-8 h-8)
- **Dashboard logos**: 64px (w-16 h-16)

## Design Notes

All logos are designed to:
- **Theme Adaptive**: Use `currentColor` for perfect dark/light theme compatibility
- **Scalable**: Clean vector graphics that scale from 16px to large sizes
- **Consistent**: Unified design language with proper stroke weights and spacing
- **Recognizable**: Clear representation of each service's core function
- **Professional**: Minimal, clean design that works in enterprise environments

## Logo Concepts

- **Helm**: Ship's wheel with spokes (navigation/steering metaphor)
- **ArgoCD**: Circular design with navigation arrow (continuous deployment)
- **Vault**: Secure safe with lock mechanism (secrets management)
- **Git**: Branch network with commit nodes (version control)
- **Security**: Shield with checkmark (user management/security)
- **Config Hub**: Central hub with connected nodes (credential management)

## Design Philosophy

All service logos are **custom-designed** to:
- **Maintain Brand Recognition**: Inspired by official service iconography
- **Ensure Theme Compatibility**: Use `currentColor` for perfect dark/light mode adaptation
- **Provide Visual Consistency**: Unified stroke weights, spacing, and design language
- **Scale Beautifully**: Clean vector graphics optimized for all sizes
- **Work in Enterprise**: Professional appearance suitable for business environments