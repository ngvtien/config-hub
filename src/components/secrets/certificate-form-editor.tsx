import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Search, Plus, Trash2, Loader2, CheckCircle, XCircle, 
  Shield, Link2, Eye, Settings, RefreshCw, FileKey
} from 'lucide-react'
import { useDialog } from '@/hooks/use-dialog'
import { useEnvironmentSettings } from '@/hooks/use-environment-settings'
import { useStagedChanges } from '@/hooks/use-staged-changes'
import { CertificateTable } from './certificate-table'
import { CertificateEditModal } from './certificate-edit-modal'
import { CertificateChainBuilder } from './certificate-chain-builder'
import { VaultAuthDialog } from './vault-auth-dialog'
import { MonacoDiffDialog } from '../monaco-diff-dialog'
import type { CertificateItem, CertificateFormData } from '@/types/certificates'
import * as yaml from 'js-yaml'

interface CertificateFormEditorProps {
  content: string
  onChange: (content: string) => void
  environment?: string
  filePath?: string
  repoUrl?: string
  branch?: string
  credentialId?: string
}

export function CertificateFormEditor({
  content,
  onChange,
  environment = 'dev',
  filePath = 'certificates.yaml',
  repoUrl = '',
  branch = 'main',
  credentialId = ''
}: CertificateFormEditorProps) {
  const { showConfirm, ConfirmDialog } = useDialog()
  const { settings } = useEnvironmentSettings()
  const { stageFile } = useStagedChanges()

  const [formData, setFormData] = useState<CertificateFormData>({ certificates: [] })
  const [originalContent, setOriginalContent] = useState(content)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCerts, setSelectedCerts] = useState<number[]>([])
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null)
  const [showChainBuilder, setShowChainBuilder] = useState(false)
  const [showDiffPreview, setShowDiffPreview] = useState(false)
  const [showVaultAuthDialog, setShowVaultAuthDialog] = useState(false)
  
  const [vaultConnectionStatus, setVaultConnectionStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle')
  const [vaultError, setVaultError] = useState<string | null>(null)
  const [vaultSuccessMessage, setVaultSuccessMessage] = useState<string | null>(null)

  const hasVaultCredentials = !!settings.vault?.credentialId

  // Auto-dismiss success messages after 3 seconds
  useEffect(() => {
    if (vaultSuccessMessage) {
      const timer = setTimeout(() => {
        setVaultSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [vaultSuccessMessage])

  // Auto-dismiss error messages after 10 seconds
  useEffect(() => {
    if (vaultError) {
      const timer = setTimeout(() => {
        setVaultError(null)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [vaultError])

  // Parse YAML content
  useEffect(() => {
    try {
      const parsed = yaml.load(content) as any
      if (parsed && typeof parsed === 'object') {
        setFormData(parsed as CertificateFormData)
      }
    } catch (err) {
      console.error('Failed to parse certificate YAML:', err)
    }
    setOriginalContent(content)
  }, [content])

  // Check Vault connection
  useEffect(() => {
    if (hasVaultCredentials) {
      checkVaultConnection()
    }
  }, [hasVaultCredentials])

  const checkVaultConnection = async () => {
    const credId = settings.vault?.credentialId
    if (!credId) {
      setVaultConnectionStatus('error')
      setVaultError('Vault credentials not configured')
      return
    }

    setVaultConnectionStatus('checking')
    setVaultError(null)

    try {
      if (!window.electronAPI?.vault) {
        throw new Error('Vault API not available')
      }

      const result = await window.electronAPI.vault.testConnection(credId)
      
      if (result.success && result.connected) {
        setVaultConnectionStatus('success')
        // Don't show banner for initial connection - status is shown in header
      } else {
        throw new Error(result.error || 'Connection test failed')
      }
    } catch (error) {
      setVaultConnectionStatus('error')
      setVaultError(error instanceof Error ? error.message : 'Failed to connect to Vault')
    }
  }

  const generateYaml = (data: CertificateFormData): string => {
    return yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    })
  }

  const handleAddCertificate = () => {
    setEditingCertIndex(-1)
  }

  const handleEditCertificate = (index: number) => {
    setEditingCertIndex(index)
  }

  const handleSaveCertificate = (cert: CertificateItem, pushToVault: boolean = false) => {
    const newCerts = [...(formData.certificates || [])]
    
    if (editingCertIndex === -1) {
      newCerts.push(cert)
    } else if (editingCertIndex !== null) {
      newCerts[editingCertIndex] = cert
    }

    const newFormData = { ...formData, certificates: newCerts }
    setFormData(newFormData)
    onChange(generateYaml(newFormData))
    setEditingCertIndex(null)

    if (pushToVault) {
      pushCertificateToVault(cert)
    }
  }

  const handleDeleteSelected = () => {
    if (selectedCerts.length === 0) return

    showConfirm({
      title: `Delete ${selectedCerts.length} certificate(s)?`,
      description: 'This will remove the certificate references. The actual certificates in Vault will not be deleted.',
      onConfirm: () => {
        const newCerts = formData.certificates.filter((_, i) => !selectedCerts.includes(i))
        const newFormData = { ...formData, certificates: newCerts }
        setFormData(newFormData)
        onChange(generateYaml(newFormData))
        setSelectedCerts([])
        setVaultSuccessMessage(`Deleted ${selectedCerts.length} certificate(s)`)
      }
    })
  }

  const pushCertificateToVault = async (cert: CertificateItem) => {
    const credId = settings.vault?.credentialId
    if (!credId || !cert.data) return

    try {
      const pathParts = cert.vaultRef.path.split('/')
      const secretPath = pathParts.slice(1).join('/')

      // Get existing data
      let existingData: Record<string, any> = {}
      try {
        const getResult = await window.electronAPI.vault.getSecret(credId, secretPath)
        if (getResult.success && getResult.data?.data?.data) {
          existingData = getResult.data.data.data
        }
      } catch (err) {
        // Secret doesn't exist yet
      }

      // Merge certificate data
      const certData = {
        ...existingData,
        [cert.vaultRef.key]: {
          thumbprint: cert.data.thumbprint,
          definition: cert.data.definition,
          password: cert.data.password || ''
        }
      }

      const result = await window.electronAPI.vault.putSecret(credId, secretPath, certData)

      if (result.success) {
        setVaultSuccessMessage(`Certificate "${cert.name}" pushed to Vault successfully!`)
      } else {
        throw new Error(result.error || 'Failed to push certificate')
      }
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : 'Failed to push certificate to Vault')
    }
  }

  const filteredCertificates = (formData.certificates || []).filter(cert => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      cert.name?.toLowerCase().includes(search) ||
      cert.type?.toLowerCase().includes(search) ||
      cert.vaultRef?.path?.toLowerCase().includes(search) ||
      cert.vaultRef?.key?.toLowerCase().includes(search)
    )
  })

  const currentYaml = generateYaml(formData)
  const hasChanges = currentYaml.trim() !== originalContent.trim()

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Success Message */}
      {vaultSuccessMessage && (
        <Alert className="m-4 mb-0 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {vaultSuccessMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {vaultError && (
        <Alert className="m-4 mb-0 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            {vaultError}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Certificate Management - {environment.toUpperCase()}</h3>
          <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-lg">
            {vaultConnectionStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {vaultConnectionStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
            {vaultConnectionStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
            <span className="text-sm">
              {vaultConnectionStatus === 'success' ? 'Vault Connected' : 'Vault Disconnected'}
            </span>
          </div>
        </div>
        <Badge variant="outline">
          {filteredCertificates.length} certificate{filteredCertificates.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Actions Bar */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certificates by name, type, path, or key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={() => setShowDiffPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Review Changes
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowChainBuilder(true)}>
            <Link2 className="h-4 w-4 mr-2" />
            Build Chain
          </Button>
          <Button size="sm" onClick={handleAddCertificate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Certificate
          </Button>
          {selectedCerts.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedCerts.length})
            </Button>
          )}
        </div>
      </div>

      {/* Certificate Table */}
      <div className="flex-1 overflow-auto">
        <CertificateTable
          certificates={filteredCertificates}
          selectedCerts={selectedCerts}
          onSelectCert={(index) => {
            setSelectedCerts(prev =>
              prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
            )
          }}
          onSelectAll={() => {
            setSelectedCerts(
              selectedCerts.length === filteredCertificates.length
                ? []
                : filteredCertificates.map((_, i) => i)
            )
          }}
          onEditCert={handleEditCertificate}
        />
      </div>

      {/* Modals */}
      <CertificateEditModal
        isOpen={editingCertIndex !== null}
        onClose={() => setEditingCertIndex(null)}
        certificate={editingCertIndex !== null && editingCertIndex >= 0 ? formData.certificates[editingCertIndex] : undefined}
        onSave={handleSaveCertificate}
        vaultConnected={vaultConnectionStatus === 'success'}
        environment={environment}
      />

      <CertificateChainBuilder
        isOpen={showChainBuilder}
        onClose={() => setShowChainBuilder(false)}
        certificates={formData.certificates}
        chains={formData.chains || {}}
        onSaveChain={(chainName, chain) => {
          const newFormData = {
            ...formData,
            chains: { ...(formData.chains || {}), [chainName]: chain }
          }
          setFormData(newFormData)
          onChange(generateYaml(newFormData))
          setShowChainBuilder(false)
        }}
      />

      <VaultAuthDialog
        isOpen={showVaultAuthDialog}
        onClose={() => setShowVaultAuthDialog(false)}
        onSuccess={() => {
          setShowVaultAuthDialog(false)
          checkVaultConnection()
        }}
        environment={environment}
      />

      <MonacoDiffDialog
        open={showDiffPreview}
        onOpenChange={setShowDiffPreview}
        fileName={filePath.split('/').pop() || 'certificates.yaml'}
        filePath={filePath}
        branch={branch}
        originalContent={originalContent}
        modifiedContent={currentYaml}
        language="yaml"
        onCreatePullRequest={() => {
          stageFile({
            path: filePath,
            name: filePath.split('/').pop() || 'certificates.yaml',
            content: currentYaml,
            originalContent: originalContent,
            repoUrl: repoUrl,
            branch: branch,
            credentialId: credentialId,
            stagedAt: Date.now()
          })
          onChange(currentYaml)
          setOriginalContent(currentYaml)
          setShowDiffPreview(false)
          setVaultSuccessMessage('Changes staged for PR!')
        }}
        onRevert={() => {
          setFormData(yaml.load(originalContent) as CertificateFormData)
          setShowDiffPreview(false)
        }}
      />

      <ConfirmDialog />
    </div>
  )
}
