import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Trash2, Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Settings, Eye } from 'lucide-react'
import { useDialog } from '@/hooks/use-dialog'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'
import { useStagedChanges } from '@/hooks/use-staged-changes'
import { SecretsTable } from '@/components/secrets/secrets-table'
import { SecretEditModal } from '@/components/secrets/secret-edit-modal'
import { VaultAuthDialog } from '@/components/secrets/vault-auth-dialog'
import { MonacoDiffDialog } from '@/components/monaco-diff-dialog'
import { useSecretsFormManager } from '@/hooks/use-secrets-form-manager'
import type { SecretItem } from '@/types/secrets'

interface SecretsFormEditorProps {
  content: string
  onChange: (content: string) => void
  environment?: string
  filePath?: string
  repoUrl?: string
  branch?: string
  credentialId?: string
}

export function SecretsFormEditor({ 
  content, 
  onChange, 
  environment = 'dev',
  filePath = 'secrets.yaml',
  repoUrl = '',
  branch = 'main',
  credentialId = ''
}: SecretsFormEditorProps) {
  const { showConfirm, ConfirmDialog } = useDialog()
  const { settings } = useEnvironmentSettings()
  const { stageFile } = useStagedChanges()
  
  const [vaultConnectionStatus, setVaultConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
  const [vaultError, setVaultError] = useState<string | null>(null)
  const [vaultSuccessMessage, setVaultSuccessMessage] = useState<string | null>(null)
  const [originalContent, setOriginalContent] = useState(content)
  const [showDiffPreview, setShowDiffPreview] = useState(false)
  
  const hasVaultCredentials = !!settings.vault?.credentialId

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (vaultSuccessMessage) {
      const timer = setTimeout(() => {
        setVaultSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [vaultSuccessMessage])

  const {
    formData,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedSecrets,
    setSelectedSecrets,
    sortConfig,
    setSortConfig,
    addSecret,
    removeSelectedSecrets,
    updateSecret,
    parseContent,
    generateYaml
  } = useSecretsFormManager(content, onChange)

  const [editingSecretIndex, setEditingSecretIndex] = useState<number | null>(null)
  const [editSecretName, setEditSecretName] = useState('')
  const [editVaultPath, setEditVaultPath] = useState('')
  const [editVaultKey, setEditVaultKey] = useState('')
  const [editSecretValue, setEditSecretValue] = useState('')
  const [showVaultAuthDialog, setShowVaultAuthDialog] = useState(false)

  // Parse content on mount and when content changes externally
  useEffect(() => {
    parseContent(content)
    setOriginalContent(content)
  }, [content, parseContent])

  // Check Vault connection on mount
  useEffect(() => {
    if (hasVaultCredentials) {
      checkVaultConnection()
    } else {
      setVaultConnectionStatus('error')
      setVaultError('Vault credentials not configured')
    }
  }, [hasVaultCredentials])

  const checkVaultConnection = async () => {
    const credentialId = settings.vault?.credentialId

    if (!credentialId) {
      setVaultConnectionStatus('error')
      setVaultError('Vault credentials not configured')
      setVaultSuccessMessage(null)
      return
    }

    setVaultConnectionStatus('checking')
    setVaultError(null)
    setVaultSuccessMessage(null)

    try {
      if (!window.electronAPI?.vault) {
        throw new Error('Vault API not available')
      }

      // Test connection using credential ID
      const result = await window.electronAPI.vault.testConnection(credentialId)
      
      if (result.success && result.connected) {
        setVaultConnectionStatus('success')
        setVaultSuccessMessage('Successfully connected to Vault!')
      } else {
        throw new Error(result.error || 'Connection test failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Vault'
      
      // Handle deleted credential gracefully
      if (errorMessage.includes('Vault credential not found')) {
        setVaultConnectionStatus('error')
        setVaultError('Vault credential was deleted. Please configure a new one.')
        setVaultSuccessMessage(null)
      } else {
        setVaultConnectionStatus('error')
        setVaultError(errorMessage)
        setVaultSuccessMessage(null)
      }
    }
  }

  const pushSecretToVault = async (secret: SecretItem, value: string) => {
    const credentialId = settings.vault?.credentialId
    if (!credentialId) {
      throw new Error('Vault credentials not configured')
    }

    if (!secret.vaultRef?.path || !secret.vaultRef?.key) {
      throw new Error('Secret must have vault path and key configured')
    }

    // Extract the secret path (remove mount prefix if present)
    // For KV v2, the path format is: mount/path/to/secret
    // We need to send just: path/to/secret
    const fullPath = secret.vaultRef.path
    const pathParts = fullPath.split('/')
    
    // Remove the mount path (first part) to get the actual secret path
    const secretPath = pathParts.slice(1).join('/')
    
    if (!secretPath) {
      throw new Error(`Invalid vault path: ${fullPath}. Expected format: mount/path/to/secret`)
    }

    // First, try to read existing secrets at this path to merge with new key
    let existingData: Record<string, any> = {}
    try {
      const getResult = await window.electronAPI.vault.getSecret(credentialId, secretPath)
      if (getResult.success && getResult.data?.data?.data) {
        existingData = getResult.data.data.data
      }
    } catch (error) {
      // Secret doesn't exist yet, that's fine - we'll create it
    }

    // Merge new key with existing keys
    const secretData = {
      ...existingData,
      [secret.vaultRef.key]: value
    }

    const result = await window.electronAPI.vault.putSecret(
      credentialId,
      secretPath,
      secretData
    )

    if (!result.success) {
      throw new Error(result.error || 'Failed to push secret to Vault')
    }

    return result
  }

  const renderVaultStatus = () => {
    const getStatusIcon = () => {
      switch (vaultConnectionStatus) {
        case 'success':
          return <CheckCircle className="h-4 w-4 text-green-500" />
        case 'error':
          return <XCircle className="h-4 w-4 text-red-500" />
        case 'checking':
          return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        default:
          return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      }
    }

    const getStatusText = () => {
      switch (vaultConnectionStatus) {
        case 'success':
          return 'Vault Connected'
        case 'error':
          return 'Vault Disconnected'
        case 'checking':
          return 'Checking Vault...'
        default:
          return 'Vault Status Unknown'
      }
    }

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {vaultConnectionStatus !== 'success' && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={checkVaultConnection}
              disabled={vaultConnectionStatus === 'checking'}
              className="h-7"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVaultAuthDialog(true)}
              className="h-7"
            >
              <Settings className="h-3 w-3 mr-1" />
              Configure
            </Button>
          </>
        )}
      </div>
    )
  }

  const handleAddSecret = () => {
    // Open modal with empty values for a new secret
    setEditingSecretIndex(-1) // Use -1 to indicate new secret
    setEditSecretName('')
    setEditVaultPath(`secret/data/${environment}`)
    setEditVaultKey('')
    setEditSecretValue('')
  }

  const handleRemoveSelected = () => {
    if (selectedSecrets.length === 0) return

    const secretNames = selectedSecrets
      .map((index: number) => formData.env[index]?.name)
      .filter(Boolean)
      .join('", "')

    showConfirm({
      title: `Remove ${selectedSecrets.length} secret(s)?`,
      description: `Are you sure you want to remove: "${secretNames}"? This action cannot be undone.`,
      onConfirm: () => {
        removeSelectedSecrets()
        setVaultSuccessMessage(`Successfully removed ${selectedSecrets.length} secret(s)`)
      }
    })
  }

  const openSecretEditModal = (index: number) => {
    const secret = formData.env[index]
    if (!secret) return

    setEditingSecretIndex(index)
    setEditSecretName(secret.name || '')
    setEditVaultPath(secret.vaultRef?.path || `secret/data/${environment}`)
    setEditVaultKey(secret.vaultRef?.key || '')
    setEditSecretValue('')
  }

  const closeSecretEditModal = () => {
    setEditingSecretIndex(null)
    setEditSecretName('')
    setEditVaultPath('')
    setEditVaultKey('')
    setEditSecretValue('')
  }

  const saveSecretChanges = async (pushToVault: boolean = false) => {
    if (editingSecretIndex === null) return

    const updatedSecret: SecretItem = {
      name: editSecretName.toUpperCase(),
      vaultRef: {
        path: editVaultPath.toLowerCase(),
        key: editVaultKey.toLowerCase()
      }
    }

    // If pushing to Vault, validate and push the secret value
    if (pushToVault && editSecretValue) {
      try {
        setVaultError(null)
        await pushSecretToVault(updatedSecret, editSecretValue)
        setVaultSuccessMessage(`Secret "${updatedSecret.name}" pushed to Vault successfully!`)
      } catch (error) {
        setVaultError(error instanceof Error ? error.message : 'Failed to push secret to Vault')
        return // Don't close modal if push failed
      }
    }

    if (editingSecretIndex === -1) {
      // Adding a new secret
      addSecret(updatedSecret)
    } else {
      // Updating existing secret
      updateSecret(editingSecretIndex, updatedSecret)
    }
    
    closeSecretEditModal()
  }

  const toggleSelectAll = () => {
    if (selectedSecrets.length === (formData.env?.length || 0)) {
      setSelectedSecrets([])
    } else {
      setSelectedSecrets(formData.env ? Array.from({ length: formData.env.length }, (_, i) => i) : [])
    }
  }

  const toggleSelectSecret = (index: number) => {
    setSelectedSecrets((prev: number[]) =>
      prev.includes(index) ? prev.filter((i: number) => i !== index) : [...prev, index]
    )
  }

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const getSortedAndFilteredSecrets = () => {
    const secrets = formData.env || []
    if (!Array.isArray(secrets)) return []

    const filteredSecrets = secrets.filter((secret: SecretItem) => {
      if (!secret || !searchTerm) return !!secret

      const nameMatch = secret.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
      const pathMatch = secret.vaultRef?.path?.toLowerCase().includes(searchTerm.toLowerCase()) || false
      const keyMatch = secret.vaultRef?.key?.toLowerCase().includes(searchTerm.toLowerCase()) || false

      return nameMatch || pathMatch || keyMatch
    })

    if (!sortConfig || !sortConfig.key) return filteredSecrets

    return [...filteredSecrets].sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sortConfig.key) {
        case 'name':
          aValue = a?.name || ''
          bValue = b?.name || ''
          break
        case 'path':
          aValue = a?.vaultRef?.path || ''
          bValue = b?.vaultRef?.path || ''
          break
        case 'key':
          aValue = a?.vaultRef?.key || ''
          bValue = b?.vaultRef?.key || ''
          break
        default:
          return 0
      }

      const comparison = aValue.localeCompare(bValue)
      return sortConfig.direction === 'ascending' ? comparison : -comparison
    })
  }

  const filteredSecrets = getSortedAndFilteredSecrets()

  // Check if content has changed
  const currentYaml = generateYaml(formData)
  const hasChanges = currentYaml.trim() !== originalContent.trim()

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Vault Success Message */}
      {vaultSuccessMessage && (
        <Alert className="m-4 mb-0 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <div className="flex items-start justify-between">
              <span>{vaultSuccessMessage}</span>
              <button
                onClick={() => setVaultSuccessMessage(null)}
                className="ml-4 text-green-600 hover:text-green-800"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Vault Connection Alert */}
      {vaultConnectionStatus === 'error' && vaultError && (
        <Alert className="m-4 mb-0 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            <div className="flex items-start justify-between">
              <div>
                {vaultError}
                {!hasVaultCredentials && (
                  <span className="block mt-1 text-sm">
                    Configure Vault credentials to enable secret synchronization.
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVaultAuthDialog(true)}
                className="ml-4 flex-shrink-0"
              >
                <Settings className="h-3 w-3 mr-1" />
                Configure Vault
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Vault Status */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Secrets Management - {environment.toUpperCase()}</h3>
          {renderVaultStatus()}
        </div>
        <Badge variant="outline" className="text-xs">
          {filteredSecrets.length} secret{filteredSecrets.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search and Actions */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search secrets by name, path, or key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiffPreview(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Review Changes
            </Button>
          )}
          <Button onClick={handleAddSecret} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Secret
          </Button>
          {selectedSecrets.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveSelected}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedSecrets.length})
            </Button>
          )}
        </div>
      </div>

      {/* Secrets Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <SecretsTable
            secrets={filteredSecrets}
            selectedSecrets={selectedSecrets}
            sortConfig={sortConfig}
            secretValues={{}}
            vaultStatuses={{}}
            onSelectSecret={toggleSelectSecret}
            onSelectAll={toggleSelectAll}
            onSort={requestSort}
            onEditSecret={openSecretEditModal}
            onSaveToVault={() => {
              // TODO: Implement save to vault
            }}
          />
        )}
      </div>

      {/* Secret Edit Modal */}
      <SecretEditModal
        isOpen={editingSecretIndex !== null}
        onClose={closeSecretEditModal}
        secretName={editSecretName}
        vaultPath={editVaultPath}
        vaultKey={editVaultKey}
        secretValue={editSecretValue}
        onSecretNameChange={setEditSecretName}
        onVaultPathChange={setEditVaultPath}
        onVaultKeyChange={setEditVaultKey}
        onSecretValueChange={setEditSecretValue}
        onSave={saveSecretChanges}
        vaultConnected={vaultConnectionStatus === 'success'}
      />

      <ConfirmDialog />

      {/* Vault Authentication Dialog */}
      <VaultAuthDialog
        isOpen={showVaultAuthDialog}
        onClose={() => setShowVaultAuthDialog(false)}
        onSuccess={() => {
          setShowVaultAuthDialog(false)
          checkVaultConnection()
        }}
        environment={environment}
      />

      {/* Diff Preview Dialog */}
      <MonacoDiffDialog
        open={showDiffPreview}
        onOpenChange={setShowDiffPreview}
        fileName={filePath.split('/').pop() || 'secrets.yaml'}
        filePath={filePath}
        branch={branch}
        originalContent={originalContent}
        modifiedContent={currentYaml}
        language="yaml"
        onCreatePullRequest={() => {
          // Stage the file for PR
          console.log('=== STAGING FILE ===')
          console.log('filePath:', filePath)
          console.log('repoUrl:', repoUrl)
          console.log('branch:', branch)
          console.log('credentialId:', credentialId)
          
          stageFile({
            path: filePath,
            name: filePath.split('/').pop() || 'secrets.yaml',
            content: currentYaml,
            originalContent: originalContent,
            repoUrl: repoUrl,
            branch: branch,
            credentialId: credentialId,
            stagedAt: Date.now()
          })
          
          console.log('stageFile() called')
          console.log('===================')
          
          // Update the editor content
          onChange(currentYaml)
          setOriginalContent(currentYaml)
          setShowDiffPreview(false)
          setVaultSuccessMessage('Changes staged for PR!')
        }}
        onRevert={() => {
          // Revert to original content in memory
          parseContent(originalContent)
          setShowDiffPreview(false)
          setVaultSuccessMessage('Changes reverted')
        }}
      />
    </div>
  )
}
