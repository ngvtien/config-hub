import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Eye, EyeOff, Upload, X, Copy, Download, File } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SecretEditModalProps {
  isOpen: boolean
  onClose: () => void
  secretName: string
  vaultPath: string
  vaultKey: string
  secretValue?: string
  onSecretNameChange: (value: string) => void
  onVaultPathChange: (value: string) => void
  onVaultKeyChange: (value: string) => void
  onSecretValueChange?: (value: string) => void
  onSave: (pushToVault?: boolean) => void
  vaultConnected?: boolean
}

export function SecretEditModal({
  isOpen,
  onClose,
  secretName,
  vaultPath,
  vaultKey,
  secretValue = '',
  onSecretNameChange,
  onVaultPathChange,
  onVaultKeyChange,
  onSecretValueChange,
  onSave,
  vaultConnected = false
}: SecretEditModalProps) {
  const [showSecretValue, setShowSecretValue] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    if (!secretName.trim() || !vaultPath.trim() || !vaultKey.trim()) {
      return
    }
    onSave()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0 || !onSecretValueChange) return

    const file = files[0]
    try {
      const content = await file.text()
      onSecretValueChange(content)
      setFileName(file.name)
    } catch (error) {
      console.error('Error reading file:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onSecretValueChange) return

    try {
      const content = await file.text()
      onSecretValueChange(content)
      setFileName(file.name)
    } catch (error) {
      console.error('Error reading file:', error)
    }

    e.target.value = ''
  }

  const handleClear = () => {
    if (onSecretValueChange) {
      onSecretValueChange('')
      setFileName(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {secretName ? 'Edit Secret' : 'Add New Secret'}
          </DialogTitle>
          <DialogDescription>
            Configure the External Secrets Operator (ESO) reference for this secret.
            This defines how the secret will be synced from HashiCorp Vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="secretName">
              Secret Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="secretName"
              placeholder="e.g., DATABASE_PASSWORD"
              value={secretName}
              onChange={(e) => onSecretNameChange(e.target.value.toUpperCase())}
              className="font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">
              The name of the secret key in the Kubernetes secret (automatically uppercase)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaultPath">
              Vault Path <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vaultPath"
              placeholder="e.g., secret/data/myapp/dev"
              value={vaultPath}
              onChange={(e) => onVaultPathChange(e.target.value.toLowerCase())}
              className="font-mono text-sm lowercase"
            />
            <p className="text-xs text-muted-foreground">
              The path to the secret in HashiCorp Vault (automatically lowercase)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vaultKey">
              Vault Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vaultKey"
              placeholder="e.g., password"
              value={vaultKey}
              onChange={(e) => onVaultKeyChange(e.target.value.toLowerCase())}
              className="font-mono text-sm lowercase"
            />
            <p className="text-xs text-muted-foreground">
              The key within the Vault secret to retrieve (automatically lowercase)
            </p>
          </div>

          {/* Optional Secret Value Section */}
          {onSecretValueChange && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="secretValue" className="flex items-center gap-2">
                  Secret Value (Optional)
                  {fileName && (
                    <Badge variant="outline" className="text-xs">
                      <File className="w-3 h-3 mr-1" />
                      {fileName}
                    </Badge>
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs h-7"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecretValue(!showSecretValue)}
                    className="text-xs h-7"
                  >
                    {showSecretValue ? (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                  {secretValue && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="text-xs h-7"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "relative border-2 border-dashed rounded-lg transition-all",
                  isDragOver ? "border-blue-400 bg-blue-50/50" : "border-gray-200"
                )}
                onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Textarea
                  id="secretValue"
                  value={secretValue}
                  onChange={(e) => onSecretValueChange(e.target.value)}
                  placeholder={isDragOver
                    ? "Drop your file here..."
                    : "Enter secret value or drag & drop a file"
                  }
                  rows={5}
                  className={cn(
                    "min-h-[120px] resize-none",
                    !showSecretValue && "font-mono"
                  )}
                  style={showSecretValue ? {} : ({ WebkitTextSecurity: "disc" } as React.CSSProperties)}
                />

                {isDragOver && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-lg pointer-events-none">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-blue-500 animate-bounce" />
                      <p className="text-sm font-medium text-blue-700">Drop file here</p>
                    </div>
                  </div>
                )}
              </div>

              {secretValue && (
                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
                  <div className="flex items-center gap-4">
                    <span>Size: {(secretValue.length / 1024).toFixed(1)} KB</span>
                    <span>Lines: {secretValue.split('\n').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(secretValue)}
                      className="h-6 px-2 text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([secretValue], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = fileName || `secret-${secretName.toLowerCase()}.txt`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {vaultConnected && onSecretValueChange && secretValue.trim() ? (
            <Button 
              onClick={() => onSave(true)}
              disabled={!secretName.trim() || !vaultPath.trim() || !vaultKey.trim()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Push to Vault & Add to Form
            </Button>
          ) : (
            <Button 
              onClick={handleSave}
              disabled={!secretName.trim() || !vaultPath.trim() || !vaultKey.trim()}
            >
              Add to Form
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
