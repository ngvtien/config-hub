import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Link2, ArrowDown, Shield, Key, Plus, X } from 'lucide-react'
import type { CertificateItem, CertificateChain, CertificateReference } from '@/types/certificates'

interface CertificateChainBuilderProps {
  isOpen: boolean
  onClose: () => void
  certificates: CertificateItem[]
  chains: Record<string, CertificateChain>
  onSaveChain: (chainName: string, chain: CertificateChain) => void
}

export function CertificateChainBuilder({
  isOpen,
  onClose,
  certificates,
  onSaveChain
}: CertificateChainBuilderProps) {
  const [chainName, setChainName] = useState('')
  const [selectedServer, setSelectedServer] = useState<CertificateReference | undefined>()
  const [selectedIntermediates, setSelectedIntermediates] = useState<CertificateReference[]>([])
  const [selectedRootCA, setSelectedRootCA] = useState<CertificateReference | undefined>()
  const [selectedClient, setSelectedClient] = useState<CertificateReference | undefined>()

  const serverCerts = certificates.filter(c => c.type === 'server')
  const intermediateCerts = certificates.filter(c => c.type === 'intermediate-ca')
  const rootCACerts = certificates.filter(c => c.type === 'root-ca')
  const clientCerts = certificates.filter(c => c.type === 'client')

  const certToReference = (cert: CertificateItem): CertificateReference => ({
    path: cert.vaultRef.path,
    key: cert.vaultRef.key,
    type: cert.type
  })

  const addIntermediate = () => {
    if (intermediateCerts.length > 0) {
      setSelectedIntermediates([...selectedIntermediates, certToReference(intermediateCerts[0])])
    }
  }

  const removeIntermediate = (index: number) => {
    setSelectedIntermediates(selectedIntermediates.filter((_, i) => i !== index))
  }

  const updateIntermediate = (index: number, certName: string) => {
    const cert = certificates.find(c => c.name === certName)
    if (cert) {
      const newIntermediates = [...selectedIntermediates]
      newIntermediates[index] = certToReference(cert)
      setSelectedIntermediates(newIntermediates)
    }
  }

  const handleSave = () => {
    if (!chainName.trim()) return

    const chain: CertificateChain = {
      server: selectedServer,
      intermediate: selectedIntermediates.length > 0 ? selectedIntermediates : undefined,
      rootCA: selectedRootCA,
      client: selectedClient
    }

    onSaveChain(chainName, chain)
    onClose()
  }

  const isValid = chainName.trim() && (selectedServer || selectedClient || selectedRootCA)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Build Certificate Chain</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert>
            <Link2 className="h-4 w-4" />
            <AlertDescription>
              Create a certificate chain by linking server, intermediate, root CA, and client certificates.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="chainName">Chain Name *</Label>
            <Input
              id="chainName"
              value={chainName}
              onChange={(e) => setChainName(e.target.value)}
              placeholder="e.g., ProductionServerChain"
            />
          </div>

          {/* Server Certificate */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <Label>Server Certificate</Label>
              </div>
              <Select
                value={selectedServer ? `${selectedServer.path}:${selectedServer.key}` : ''}
                onValueChange={(value) => {
                  if (!value) {
                    setSelectedServer(undefined)
                    return
                  }
                  const cert = certificates.find(c => `${c.vaultRef.path}:${c.vaultRef.key}` === value)
                  if (cert) setSelectedServer(certToReference(cert))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select server certificate" />
                </SelectTrigger>
                <SelectContent>
                  {serverCerts.map((cert) => (
                    <SelectItem key={cert.name} value={`${cert.vaultRef.path}:${cert.vaultRef.key}`}>
                      {cert.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Intermediate Certificates */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-orange-500" />
                  <Label>Intermediate Certificates</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addIntermediate}
                  disabled={intermediateCerts.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {selectedIntermediates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No intermediate certificates added</p>
              ) : (
                <div className="space-y-2">
                  {selectedIntermediates.map((intermediate, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                      <Select
                        value={`${intermediate.path}:${intermediate.key}`}
                        onValueChange={(value) => {
                          const certName = certificates.find(c => `${c.vaultRef.path}:${c.vaultRef.key}` === value)?.name
                          if (certName) updateIntermediate(index, certName)
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {intermediateCerts.map((cert) => (
                            <SelectItem key={cert.name} value={`${cert.vaultRef.path}:${cert.vaultRef.key}`}>
                              {cert.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIntermediate(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Root CA Certificate */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <Label>Root CA Certificate</Label>
              </div>
              <Select
                value={selectedRootCA ? `${selectedRootCA.path}:${selectedRootCA.key}` : ''}
                onValueChange={(value) => {
                  if (!value) {
                    setSelectedRootCA(undefined)
                    return
                  }
                  const cert = certificates.find(c => `${c.vaultRef.path}:${c.vaultRef.key}` === value)
                  if (cert) setSelectedRootCA(certToReference(cert))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select root CA certificate" />
                </SelectTrigger>
                <SelectContent>
                  {rootCACerts.map((cert) => (
                    <SelectItem key={cert.name} value={`${cert.vaultRef.path}:${cert.vaultRef.key}`}>
                      {cert.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Client Certificate */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-green-500" />
                <Label>Client Certificate (Optional)</Label>
              </div>
              <Select
                value={selectedClient ? `${selectedClient.path}:${selectedClient.key}` : ''}
                onValueChange={(value) => {
                  if (!value) {
                    setSelectedClient(undefined)
                    return
                  }
                  const cert = certificates.find(c => `${c.vaultRef.path}:${c.vaultRef.key}` === value)
                  if (cert) setSelectedClient(certToReference(cert))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client certificate" />
                </SelectTrigger>
                <SelectContent>
                  {clientCerts.map((cert) => (
                    <SelectItem key={cert.name} value={`${cert.vaultRef.path}:${cert.vaultRef.key}`}>
                      {cert.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Chain Preview */}
          {isValid && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <Label className="mb-3 block">Chain Preview</Label>
                <div className="space-y-2 text-sm font-mono">
                  {selectedClient && (
                    <div className="flex items-center gap-2">
                      <Key className="h-3 w-3 text-green-500" />
                      <span>Client: {selectedClient.key}</span>
                    </div>
                  )}
                  {selectedServer && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-blue-500" />
                      <span>Server: {selectedServer.key}</span>
                    </div>
                  )}
                  {selectedIntermediates.map((intermediate, i) => (
                    <div key={i} className="flex items-center gap-2 pl-4">
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      <Link2 className="h-3 w-3 text-orange-500" />
                      <span>Intermediate {i + 1}: {intermediate.key}</span>
                    </div>
                  ))}
                  {selectedRootCA && (
                    <div className="flex items-center gap-2 pl-4">
                      <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      <Shield className="h-3 w-3 text-purple-500" />
                      <span>Root CA: {selectedRootCA.key}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            <Link2 className="h-4 w-4 mr-2" />
            Save Chain
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
