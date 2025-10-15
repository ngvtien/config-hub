import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Upload, Info, Shield, Link2, Plus, X } from 'lucide-react'
import type { CertificateItem, CertificateType, CertificateRelationship } from '@/types/certificates'

interface CertificateEditModalProps {
  isOpen: boolean
  onClose: () => void
  certificate?: CertificateItem
  onSave: (cert: CertificateItem, pushToVault: boolean) => void
  vaultConnected: boolean
  environment: string
}

export function CertificateEditModal({
  isOpen,
  onClose,
  certificate,
  onSave,
  vaultConnected,
  environment
}: CertificateEditModalProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CertificateType>('server')
  const [vaultPath, setVaultPath] = useState(`kv-v2/${environment}/org1/cai/certs/servers`)
  const [vaultKey, setVaultKey] = useState('')
  const [thumbprint, setThumbprint] = useState('')
  const [definition, setDefinition] = useState('')
  const [password, setPassword] = useState('')
  const [relationships, setRelationships] = useState<CertificateRelationship[]>([])
  const [pushToVault, setPushToVault] = useState(false)

  useEffect(() => {
    if (certificate) {
      setName(certificate.name)
      setType(certificate.type)
      setVaultPath(certificate.vaultRef.path)
      setVaultKey(certificate.vaultRef.key)
      setThumbprint(certificate.data?.thumbprint || '')
      setDefinition(certificate.data?.definition || '')
      setPassword(certificate.data?.password || '')
      setRelationships(certificate.relationships || [])
    } else {
      // Reset for new certificate
      setName('')
      setType('server')
      setVaultPath(`kv-v2/${environment}/org1/cai/certs/servers`)
      setVaultKey('')
      setThumbprint('')
      setDefinition('')
      setPassword('')
      setRelationships([])
    }
    setPushToVault(false)
  }, [certificate, isOpen, environment])

  const handleTypeChange = (newType: CertificateType) => {
    setType(newType)
    // Update default vault path based on type
    const pathMap = {
      'server': `kv-v2/${environment}/org1/cai/certs/servers`,
      'client': `kv-v2/${environment}/org1/cai/certs/clients`,
      'root-ca': `kv-v2/${environment}/org1/cai/certs/roots`,
      'intermediate-ca': `kv-v2/${environment}/org1/cai/certs/intermediates`
    }
    setVaultPath(pathMap[newType])
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setDefinition(content)
      
      // Try to extract thumbprint from certificate
      // This is a simplified version - in production, use a proper crypto library
      if (content.includes('BEGIN CERTIFICATE')) {
        // Generate a placeholder thumbprint
        const hash = content.substring(0, 100).split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0)
          return a & a
        }, 0)
        setThumbprint(Math.abs(hash).toString(16).toUpperCase().padStart(16, '0'))
      }
    }
    reader.readAsText(file)
  }

  const addRelationship = () => {
    setRelationships([
      ...relationships,
      { type: 'signs', targetPath: '', targetKey: '' }
    ])
  }

  const updateRelationship = (index: number, field: keyof CertificateRelationship, value: string) => {
    const newRels = [...relationships]
    newRels[index] = { ...newRels[index], [field]: value }
    setRelationships(newRels)
  }

  const removeRelationship = (index: number) => {
    setRelationships(relationships.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    const cert: CertificateItem = {
      name,
      type,
      vaultRef: {
        path: vaultPath.toLowerCase(),
        key: vaultKey.toLowerCase()
      },
      data: definition ? {
        thumbprint,
        definition,
        password
      } : undefined,
      relationships: relationships.length > 0 ? relationships : undefined
    }
    onSave(cert, pushToVault)
  }

  const isValid = name && vaultPath && vaultKey

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {certificate ? 'Edit Certificate' : 'Add Certificate'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="certificate">Certificate Data</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Certificate Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CaiServerCertificate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Certificate Type *</Label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="server">Server Certificate</SelectItem>
                  <SelectItem value="client">Client Certificate</SelectItem>
                  <SelectItem value="root-ca">Root CA Certificate</SelectItem>
                  <SelectItem value="intermediate-ca">Intermediate CA Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaultPath">Vault Path *</Label>
              <Input
                id="vaultPath"
                value={vaultPath}
                onChange={(e) => setVaultPath(e.target.value)}
                placeholder="kv-v2/dev/org1/cai/certs/servers"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format: mount/path/to/secret (e.g., kv-v2/dev/org1/cai/certs/servers)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vaultKey">Vault Key *</Label>
              <Input
                id="vaultKey"
                value={vaultKey}
                onChange={(e) => setVaultKey(e.target.value)}
                placeholder="CaiServerCertificate"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The key name within the Vault secret
              </p>
            </div>
          </TabsContent>

          <TabsContent value="certificate" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Certificate data is optional. You can add it now or push it to Vault later.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="thumbprint">Thumbprint</Label>
              <Input
                id="thumbprint"
                value={thumbprint}
                onChange={(e) => setThumbprint(e.target.value)}
                placeholder="ABCD1234EFGH5678"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="definition">Certificate Definition (PEM)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('cert-file-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Certificate
                </Button>
                <input
                  id="cert-file-upload"
                  type="file"
                  accept=".pem,.crt,.cer"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              <Textarea
                id="definition"
                value={definition}
                onChange={(e) => setDefinition(e.target.value)}
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIID...&#10;-----END CERTIFICATE-----"
                className="font-mono text-xs h-48"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password (Optional)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Certificate password"
              />
            </div>
          </TabsContent>

          <TabsContent value="relationships" className="space-y-4">
            <Alert>
              <Link2 className="h-4 w-4" />
              <AlertDescription>
                Define relationships between certificates (e.g., which CA signs this certificate)
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {relationships.map((rel, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Relationship {index + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRelationship(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={rel.type}
                        onValueChange={(value) => updateRelationship(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="signs">Signs</SelectItem>
                          <SelectItem value="trusts">Trusts</SelectItem>
                          <SelectItem value="validates">Validates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Target Path</Label>
                      <Input
                        value={rel.targetPath}
                        onChange={(e) => updateRelationship(index, 'targetPath', e.target.value)}
                        placeholder="kv-v2/dev/org1/cai/certs/roots"
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Target Key</Label>
                      <Input
                        value={rel.targetKey}
                        onChange={(e) => updateRelationship(index, 'targetKey', e.target.value)}
                        placeholder="RootCA1"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRelationship}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Relationship
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {vaultConnected && definition && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={pushToVault}
                  onChange={(e) => setPushToVault(e.target.checked)}
                  className="rounded"
                />
                Push to Vault immediately
              </label>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid}>
              <Shield className="h-4 w-4 mr-2" />
              Save Certificate
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
