import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Shield, Key, Link2 } from 'lucide-react'
import type { CertificateItem } from '@/types/certificates'

interface CertificateTableProps {
  certificates: CertificateItem[]
  selectedCerts: number[]
  onSelectCert: (index: number) => void
  onSelectAll: () => void
  onEditCert: (index: number) => void
}

const getCertTypeColor = (type: string) => {
  switch (type) {
    case 'server': return 'bg-blue-100 text-blue-800'
    case 'client': return 'bg-green-100 text-green-800'
    case 'root-ca': return 'bg-purple-100 text-purple-800'
    case 'intermediate-ca': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getCertTypeIcon = (type: string) => {
  switch (type) {
    case 'server': return <Shield className="h-3 w-3" />
    case 'client': return <Key className="h-3 w-3" />
    case 'root-ca': return <Shield className="h-3 w-3" />
    case 'intermediate-ca': return <Link2 className="h-3 w-3" />
    default: return <Shield className="h-3 w-3" />
  }
}

export function CertificateTable({
  certificates,
  selectedCerts,
  onSelectCert,
  onSelectAll,
  onEditCert
}: CertificateTableProps) {
  if (certificates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No certificates configured</p>
          <p className="text-sm mt-2">Click "Add Certificate" to get started</p>
        </div>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selectedCerts.length === certificates.length}
              onCheckedChange={onSelectAll}
            />
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Vault Path</TableHead>
          <TableHead>Vault Key</TableHead>
          <TableHead>Relationships</TableHead>
          <TableHead className="w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {certificates.map((cert, index) => (
          <TableRow key={index}>
            <TableCell>
              <Checkbox
                checked={selectedCerts.includes(index)}
                onCheckedChange={() => onSelectCert(index)}
              />
            </TableCell>
            <TableCell className="font-medium">{cert.name}</TableCell>
            <TableCell>
              <Badge className={getCertTypeColor(cert.type)}>
                <span className="flex items-center gap-1">
                  {getCertTypeIcon(cert.type)}
                  {cert.type}
                </span>
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{cert.vaultRef.path}</TableCell>
            <TableCell className="font-mono text-xs">{cert.vaultRef.key}</TableCell>
            <TableCell>
              {cert.relationships && cert.relationships.length > 0 ? (
                <div className="flex gap-1">
                  {cert.relationships.map((rel, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {rel.type}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">None</span>
              )}
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditCert(index)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
