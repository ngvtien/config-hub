# Service Logos

This directory contains SVG logos for various services integrated with Config Hub.

## Available Logos

### **Config Hub (Main App)**
- `../config-hub-logo-light.svg` - Full logo for light theme
- `../config-hub-logo-dark.svg` - Full logo for dark theme  
- `../config-hub-monogram-light.svg` - Compact logo for light theme
- `../config-hub-monogram-dark.svg` - Compact logo for dark theme

### **Integrated Services**
- `helm-logo.svg` - Helm package manager (ship's wheel design)
- `argocd-logo.svg` - ArgoCD continuous deployment (navigation arrow)
- `vault-logo.svg` - HashiCorp Vault secrets management (vault/safe)
- `git-logo.svg` - Git version control (branch/merge design)

## Usage

### **In React Components**
```jsx
// Service-specific logos
<img src="/logos/helm-logo.svg" alt="Helm" className="w-6 h-6" />
<img src="/logos/argocd-logo.svg" alt="ArgoCD" className="w-6 h-6" />
<img src="/logos/vault-logo.svg" alt="Vault" className="w-6 h-6" />
<img src="/logos/git-logo.svg" alt="Git" className="w-6 h-6" />

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
- Work with `currentColor` for theme compatibility
- Scale cleanly from 16px to large sizes
- Maintain visual consistency with Config Hub branding
- Represent the core function of each service
- Use minimal, professional design language

## Logo Concepts

- **Helm**: Ship's wheel (navigation/steering)
- **ArgoCD**: Navigation arrow (continuous deployment)
- **Vault**: Safe/vault (secure storage)
- **Git**: Branch network (version control)
- **Config Hub**: Central hub with connected nodes (credential management)