import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSchemaEditorStore } from '@/stores/schema-editor-store'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Plus,
    Trash2,
    ChevronRight,
    Type,
    Hash,
    ToggleLeft,
    List,
    Braces,
    File,
    Sparkles
} from 'lucide-react'
// Note: Resizable components not available, using simple layout

interface SchemaProperty {
    type: string
    title?: string
    description?: string
    default?: any
    enum?: any[]
    properties?: { [key: string]: SchemaProperty }
    items?: SchemaProperty
    required?: string[]
}



interface SchemaEditorFormProps {
    content: string
    onChange: (content: string) => void
    filePath: string
    onShowDiff: (originalContent: string, modifiedContent: string) => void
}

// Add Property Dialog Component
const AddPropertyDialog = React.memo(({
    onAddProperty,
    existingProperties,
    parentPath = "",
}: {
    onAddProperty: (parentPath: string, name: string, property: SchemaProperty) => void
    existingProperties: string[]
    parentPath?: string
}) => {
    const [open, setOpen] = useState(false)
    const [propertyName, setPropertyName] = useState("")
    const [propertyType, setPropertyType] = useState("string")
    const [propertyTitle, setPropertyTitle] = useState("")
    const [propertyDescription, setPropertyDescription] = useState("")
    const [error, setError] = useState("")

    const resetForm = useCallback(() => {
        setPropertyName("")
        setPropertyType("string")
        setPropertyTitle("")
        setPropertyDescription("")
        setError("")
    }, [])

    const handleSubmit = useCallback(() => {
        const trimmedName = propertyName.trim()

        if (!trimmedName) {
            setError("Property name is required")
            return
        }

        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedName)) {
            setError("Property name must start with a letter and contain only letters, numbers, and underscores")
            return
        }

        if (existingProperties.includes(trimmedName)) {
            setError(`Property "${trimmedName}" already exists at this level`)
            return
        }

        const newProperty: SchemaProperty = {
            type: propertyType,
            title: propertyTitle.trim() || trimmedName,
            description: propertyDescription.trim(),
        }

        // Set default values based on type
        switch (propertyType) {
            case "string":
                newProperty.default = ""
                break
            case "number":
            case "integer":
                newProperty.default = 0
                break
            case "boolean":
                newProperty.default = false
                break
            case "object":
                newProperty.properties = {}
                break
            case "array":
                newProperty.items = { type: "string" }
                newProperty.default = []
                break
        }

        onAddProperty(parentPath, trimmedName, newProperty)
        resetForm()
        setOpen(false)
    }, [propertyName, propertyType, propertyTitle, propertyDescription, existingProperties, parentPath, onAddProperty, resetForm])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Property
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Property</DialogTitle>
                    <DialogDescription>
                        Create a new property for your schema.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="property-name">Property Name *</Label>
                        <Input
                            id="property-name"
                            value={propertyName}
                            onChange={(e) => {
                                setPropertyName(e.target.value)
                                setError("")
                            }}
                            placeholder="e.g., myProperty"
                            className={error ? "border-destructive" : ""}
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="property-type">Type</Label>
                        <Select value={propertyType} onValueChange={setPropertyType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="string">String</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="integer">Integer</SelectItem>
                                <SelectItem value="boolean">Boolean</SelectItem>
                                <SelectItem value="object">Object</SelectItem>
                                <SelectItem value="array">Array</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="property-title">Display Title</Label>
                        <Input
                            id="property-title"
                            value={propertyTitle}
                            onChange={(e) => setPropertyTitle(e.target.value)}
                            placeholder="Human-readable title (optional)"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="property-description">Description</Label>
                        <Textarea
                            id="property-description"
                            value={propertyDescription}
                            onChange={(e) => setPropertyDescription(e.target.value)}
                            placeholder="Describe what this property is for (optional)"
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>Add Property</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
})

AddPropertyDialog.displayName = "AddPropertyDialog"

// Tree Node Component
const TreeNode = React.memo(({
    node,
    level = 0,
    onSelect,
    selectedPath,
}: {
    node: any
    level?: number
    onSelect: (path: string) => void
    selectedPath: string | null
}) => {
    const [isExpanded, setIsExpanded] = useState(true)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedPath === node.path

    return (
        <div>
            <div
                className={`flex items-center py-2 px-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                    }`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onSelect(node.path)}
            >
                {hasChildren && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 mr-2"
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsExpanded(!isExpanded)
                        }}
                    >
                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </Button>
                )}

                <div className="mr-2">{node.icon}</div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{node.title}</span>
                        <Badge variant="secondary" className="text-xs">
                            {node.type}
                        </Badge>
                    </div>
                    {node.description && (
                        <p className="text-xs text-muted-foreground truncate">{node.description}</p>
                    )}
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="ml-4">
                    {node.children.map((child: any) => (
                        <TreeNode
                            key={child.path}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})

TreeNode.displayName = "TreeNode"

export function SchemaEditorForm({ content, onChange, filePath, onShowDiff }: SchemaEditorFormProps) {
    const [selectedPath, setSelectedPath] = useState<string | null>(null)
    const [editingProperty, setEditingProperty] = useState<SchemaProperty | null>(null)
    const lastContentRef = useRef<string>('')

    // Use schema editor store for pre-staging changes
    const {
        setPrestagedChanges,
        clearPrestagedChanges,
        hasPrestagedChanges
    } = useSchemaEditorStore()

    // Subscribe to the pre-staged changes for this file
    const prestagedChanges = useSchemaEditorStore((state) => state.prestagedChanges[filePath])

    // Get the current schema (either pre-staged or from content)
    const schema = useMemo(() => {
        if (prestagedChanges) {
            console.log('Using pre-staged changes for schema:', prestagedChanges)
            return prestagedChanges
        }
        try {
            const parsed = JSON.parse(content)
            console.log('Using original content for schema:', parsed)
            return parsed
        } catch (error) {
            console.error("Failed to parse schema:", error)
            return { type: "object", properties: {} }
        }
    }, [prestagedChanges, content])

    console.log('SchemaEditorForm rendered with content:', content.substring(0, 100))
    console.log('Has pre-staged changes:', hasPrestagedChanges(filePath))
    console.log('Current schema properties:', Object.keys(schema.properties || {}))
    console.log('Pre-staged changes:', prestagedChanges)

    // Initialize pre-staged schema when file changes
    useEffect(() => {
        if (content !== lastContentRef.current) {
            lastContentRef.current = content
            console.log('SchemaEditorForm: Content changed, clearing pre-staged changes')
            clearPrestagedChanges(filePath)
        }
    }, [content, filePath, clearPrestagedChanges])

    // Show diff for review before staging
    const handleSaveChanges = useCallback(() => {
        if (prestagedChanges) {
            const modifiedContent = JSON.stringify(prestagedChanges, null, 2)
            onShowDiff(content, modifiedContent)
        }
    }, [prestagedChanges, content, onShowDiff])

    // Discard pre-staged changes
    const discardChanges = useCallback(() => {
        clearPrestagedChanges(filePath)
        setSelectedPath(null)
        setEditingProperty(null)
    }, [clearPrestagedChanges, filePath])

    const getTypeIcon = useCallback((type: string) => {
        const icons = {
            string: <Type className="h-4 w-4 text-emerald-500" />,
            number: <Hash className="h-4 w-4 text-blue-500" />,
            integer: <Hash className="h-4 w-4 text-blue-500" />,
            boolean: <ToggleLeft className="h-4 w-4 text-purple-500" />,
            object: <Braces className="h-4 w-4 text-amber-500" />,
            array: <List className="h-4 w-4 text-pink-500" />,
        }
        return icons[type as keyof typeof icons] || <File className="h-4 w-4 text-gray-500" />
    }, [])

    const buildTreeData = useCallback((properties: { [key: string]: SchemaProperty }, basePath = ""): any[] => {
        return Object.entries(properties).map(([key, property]) => {
            const currentPath = basePath ? `${basePath}.${key}` : key
            const children: any[] = []

            if (property.type === "object" && property.properties) {
                children.push(...buildTreeData(property.properties, currentPath))
            }

            return {
                path: currentPath,
                title: property.title || key,
                type: property.type,
                description: property.description,
                icon: getTypeIcon(property.type),
                children: children.length > 0 ? children : undefined,
            }
        })
    }, [getTypeIcon])

    // Memoize tree data to prevent unnecessary re-renders
    const treeData = useMemo(() => {
        const rootChildren = buildTreeData(schema.properties)
        return [{
            path: "root",
            title: "Root Schema",
            type: schema.type,
            description: "Root schema configuration",
            icon: getTypeIcon(schema.type),
            children: rootChildren.length > 0 ? rootChildren : undefined,
        }]
    }, [schema.properties, schema.type, buildTreeData, getTypeIcon]) // Include function dependencies to ensure updates

    const getPropertyByPath = useCallback((path: string): SchemaProperty | null => {
        if (path === "root") {
            return schema as SchemaProperty
        }

        const parts = path.split(".")
        let current: any = schema

        for (const part of parts) {
            if (current.properties && current.properties[part]) {
                current = current.properties[part]
            } else {
                return null
            }
        }

        return current
    }, [schema])

    const handleSelectProperty = useCallback((path: string) => {
        setSelectedPath(path)
        const property = getPropertyByPath(path)
        setEditingProperty(property)
    }, [getPropertyByPath])

    // Memoized handlers for property editing to prevent re-renders on keystroke
    const handlePropertyTitleChange = useCallback((value: string) => {
        setEditingProperty(prev => prev ? { ...prev, title: value } : null)
    }, [])

    const handlePropertyDescriptionChange = useCallback((value: string) => {
        setEditingProperty(prev => prev ? { ...prev, description: value } : null)
    }, [])

    const handlePropertyTypeChange = useCallback((value: string) => {
        setEditingProperty(prev => prev ? { ...prev, type: value } : null)
    }, [])

    const handlePropertyDefaultChange = useCallback((value: any) => {
        setEditingProperty(prev => prev ? { ...prev, default: value } : null)
    }, [])

    const addNewProperty = useCallback((parentPath: string, propertyName: string, property: SchemaProperty) => {
        const newSchema = JSON.parse(JSON.stringify(schema))
        let current: any = newSchema

        if (parentPath && parentPath !== "root") {
            const parts = parentPath.split(".")
            for (const part of parts) {
                if (current.properties && current.properties[part]) {
                    current = current.properties[part]
                }
            }
        }

        if (!current.properties) {
            current.properties = {}
        }

        current.properties[propertyName] = property
        console.log('Add Property: Setting pre-staged changes', newSchema)
        setPrestagedChanges(filePath, newSchema)
    }, [schema, setPrestagedChanges, filePath])

    const removeProperty = useCallback((propertyPath: string) => {
        if (propertyPath === "root") {
            // Can't remove root
            return
        }

        const newSchema = JSON.parse(JSON.stringify(schema))
        const parts = propertyPath.split(".")
        const propertyName = parts[parts.length - 1]
        const parentPath = parts.slice(0, -1)

        let current: any = newSchema
        for (const part of parentPath) {
            if (current.properties && current.properties[part]) {
                current = current.properties[part]
            } else {
                return // Parent not found
            }
        }

        if (current.properties && current.properties[propertyName]) {
            delete current.properties[propertyName]
            console.log('Remove Property: Setting pre-staged changes', newSchema)
            setPrestagedChanges(filePath, newSchema)
            
            // Clear selection since the property was removed
            setSelectedPath(null)
            setEditingProperty(null)
        }
    }, [schema, setPrestagedChanges, filePath])

    const getExistingProperties = useCallback((path: string): string[] => {
        if (path === "root" || !path) {
            return Object.keys(schema.properties || {})
        }

        const parts = path.split(".")
        let current: any = schema

        for (const part of parts) {
            if (current.properties && current.properties[part]) {
                current = current.properties[part]
            } else {
                return []
            }
        }

        return Object.keys(current.properties || {})
    }, [schema])

    return (
        <div className="h-full flex relative">
            {/* Schema Tree */}
            <div className="w-2/5 border-r">
                <Card className="h-full border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Schema Structure</CardTitle>
                            {selectedPath && editingProperty && (editingProperty.type === "object" || selectedPath === "root") && (
                                <AddPropertyDialog
                                    onAddProperty={addNewProperty}
                                    existingProperties={getExistingProperties(selectedPath)}
                                    parentPath={selectedPath === "root" ? "" : selectedPath}
                                />
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ScrollArea className="h-[calc(100vh-300px)]">
                            {treeData.map((node) => (
                                <TreeNode
                                    key={node.path}
                                    node={node}
                                    onSelect={handleSelectProperty}
                                    selectedPath={selectedPath}
                                />
                            ))}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Property Editor */}
            <div className="w-3/5">
                <Card className="h-full border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Property Editor</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ScrollArea className="h-[calc(100vh-300px)] pb-16">
                            {editingProperty ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Title</Label>
                                        <Input
                                            value={editingProperty.title || ""}
                                            onChange={(e) => handlePropertyTitleChange(e.target.value)}
                                            placeholder="Property title"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            value={editingProperty.description || ""}
                                            onChange={(e) => handlePropertyDescriptionChange(e.target.value)}
                                            placeholder="Property description"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <Select
                                            value={editingProperty.type}
                                            onValueChange={handlePropertyTypeChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="string">String</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="integer">Integer</SelectItem>
                                                <SelectItem value="boolean">Boolean</SelectItem>
                                                <SelectItem value="object">Object</SelectItem>
                                                <SelectItem value="array">Array</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Default Value</Label>
                                        <Input
                                            value={editingProperty.default ?? ""}
                                            onChange={(e) => {
                                                let value: any = e.target.value
                                                if (editingProperty.type === "number" || editingProperty.type === "integer") {
                                                    value = Number(value) || 0
                                                } else if (editingProperty.type === "boolean") {
                                                    value = value === "true"
                                                }
                                                handlePropertyDefaultChange(value)
                                            }}
                                            placeholder="Default value"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Button
                                            onClick={() => {
                                                if (!selectedPath || !editingProperty) return

                                                // Update the schema with edited property
                                                const newSchema = JSON.parse(JSON.stringify(schema))

                                                if (selectedPath === "root") {
                                                    // Update root schema properties
                                                    Object.assign(newSchema, editingProperty)
                                                } else {
                                                    // Navigate to the property and update it
                                                    const parts = selectedPath.split(".")
                                                    let current: any = newSchema

                                                    for (let i = 0; i < parts.length - 1; i++) {
                                                        const part = parts[i]
                                                        if (current.properties && current.properties[part]) {
                                                            current = current.properties[part]
                                                        }
                                                    }

                                                    const lastPart = parts[parts.length - 1]
                                                    if (current.properties && current.properties[lastPart]) {
                                                        current.properties[lastPart] = { ...editingProperty }
                                                    }
                                                }

                                                console.log('Update Property: Setting pre-staged changes', newSchema)
                                                setPrestagedChanges(filePath, newSchema)
                                                
                                                // Refresh the editing property from the updated schema
                                                const updatedProperty = selectedPath === "root" 
                                                    ? newSchema as SchemaProperty
                                                    : (() => {
                                                        const parts = selectedPath.split(".")
                                                        let current: any = newSchema
                                                        for (const part of parts) {
                                                            if (current.properties && current.properties[part]) {
                                                                current = current.properties[part]
                                                            } else {
                                                                return null
                                                            }
                                                        }
                                                        return current
                                                    })()
                                                
                                                if (updatedProperty) {
                                                    console.log('Update Property: Refreshing editing property', updatedProperty)
                                                    setEditingProperty(updatedProperty)
                                                }
                                            }}
                                            className="w-full"
                                        >
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Update Property
                                        </Button>

                                        {/* Remove Property Button - Only show for non-root properties */}
                                        {selectedPath && selectedPath !== "root" && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="destructive"
                                                        className="w-full"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Remove Property
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Remove Property</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to remove the property "{editingProperty?.title || selectedPath?.split('.').pop()}"? 
                                                            This action cannot be undone and will remove the property and all its nested properties.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => {
                                                                if (selectedPath) {
                                                                    removeProperty(selectedPath)
                                                                }
                                                            }}
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        >
                                                            Remove Property
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center">
                                    <div>
                                        <Braces className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                                        <h3 className="text-lg font-medium">Select a Property</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Choose a property from the schema structure to edit its details
                                        </p>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Save/Discard Actions - Fixed at bottom */}
            {hasPrestagedChanges(filePath) && (
                <div className="absolute bottom-0 left-0 right-0 bg-background border-t p-4">
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={discardChanges}>
                            Discard Changes
                        </Button>
                        <Button onClick={handleSaveChanges}>
                            Review & Save Changes
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}