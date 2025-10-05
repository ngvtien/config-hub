# Config Hub Scripts

This directory contains utility scripts organized by feature area.

## Script Structure

### 🔧 [ArgoCD Scripts](./argocd/)
Scripts for ArgoCD setup, configuration, and testing.

- **setup-argocd-account-wsl.ps1** - Setup ArgoCD account in WSL environment
- **setup-argocd-account.ps1** - Setup ArgoCD account (Windows PowerShell)
- **setup-argocd-account.sh** - Setup ArgoCD account (Linux/Mac)
- **test-argocd-integration.ps1** - Test ArgoCD integration

### 🔐 [Vault Scripts](./vault/)
Scripts for HashiCorp Vault configuration and management.

- **replace-vault-settings.ps1** - Replace Vault settings in configuration

### 🚀 [Deployment Scripts](./deployment/)
Scripts for deploying sample applications and ApplicationSets.

- **deploy-sample-apps.ps1** - Deploy sample applications (Windows PowerShell)
- **deploy-sample-apps.sh** - Deploy sample applications (Linux/Mac)
- **deploy-sample-appset.sh** - Deploy sample ApplicationSets

### 💻 [Development Scripts](./development/)
Scripts for development workflow and testing.

- **dev-electron.bat** - Start Electron development mode (Windows batch)
- **launcher.bat** - Application launcher (Windows batch)
- **launcher.ps1** - Application launcher (Windows PowerShell)
- **startup-test.js** - Startup testing script

## Usage

### Running PowerShell Scripts

```powershell
# Navigate to the script directory
cd scripts/argocd

# Run the script
.\setup-argocd-account.ps1
```

### Running Shell Scripts

```bash
# Navigate to the script directory
cd scripts/argocd

# Make the script executable (if needed)
chmod +x setup-argocd-account.sh

# Run the script
./setup-argocd-account.sh
```

### Running Batch Scripts

```cmd
# Navigate to the script directory
cd scripts\development

# Run the script
dev-electron.bat
```

## Script Conventions

- **`.ps1`** - PowerShell scripts (Windows)
- **`.sh`** - Shell scripts (Linux/Mac/WSL)
- **`.bat`** - Batch scripts (Windows CMD)
- **`.js`** - Node.js scripts (Cross-platform)

## Adding New Scripts

When adding new scripts:
1. Place them in the appropriate feature folder
2. Update this README with a description
3. Include usage examples in the script comments
4. Follow the existing naming conventions
5. Ensure cross-platform compatibility where possible
