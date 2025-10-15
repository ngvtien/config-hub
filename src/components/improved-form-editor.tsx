import { useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react'

interface ImprovedFormEditorProps {
  schema: any
  formData: any
  onChange: (data: any) => void
}

export function ImprovedFormEditor({ schema, formData, onChange }: ImprovedFormEditorProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Memoize to prevent unnecessary re-renders
  const memoizedFormData = useMemo(() => formData, [JSON.stringify(formData)])

  const toggleSection = useCallback((path: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }, [])

  const getPropertyTitle = useCallback((schema: any, key: string): string => {
    if (schema?.properties?.[key]?.title) {
      return schema.properties[key].title
    }
    // Convert camelCase/snake_case to Title Case
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }, [])

  const updateValue = useCallback((path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(memoizedFormData))
    let current = newData

    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {}
      }
      current = current[path[i]]
    }

    current[path[path.length - 1]] = value
    onChange(newData)
  }, [memoizedFormData, onChange])

  const addArrayItem = useCallback((path: string[], itemType: string) => {
    const newData = JSON.parse(JSON.stringify(memoizedFormData))
    let current = newData

    for (let i = 0; i < path.length; i++) {
      if (!current[path[i]]) {
        current[path[i]] = []
      }
      current = current[path[i]]
    }

    if (itemType === 'object') {
      current.push({})
    } else if (itemType === 'number') {
      current.push(0)
    } else {
      current.push('')
    }

    onChange(newData)
  }, [memoizedFormData, onChange])

  const removeArrayItem = useCallback((path: string[], index: number) => {
    const newData = JSON.parse(JSON.stringify(memoizedFormData))
    let current = newData

    for (let i = 0; i < path.length; i++) {
      current = current[path[i]]
    }

    if (Array.isArray(current)) {
      current.splice(index, 1)
      onChange(newData)
    }
  }, [memoizedFormData, onChange])

  const renderField = useCallback((
    key: string,
    value: any,
    path: string[],
    schema: any,
    level: number = 0
  ): JSX.Element => {
    const fullPath = [...path, key]
    const pathKey = fullPath.join('.')
    const isCollapsed = collapsedSections.has(pathKey)
    const fieldSchema = schema?.properties?.[key]
    const title = getPropertyTitle(schema, key)

    // Array handling - check schema type if value is undefined
    const isArrayType = fieldSchema?.type === 'array' || Array.isArray(value)
    
    if (isArrayType) {
      const arrayValue = Array.isArray(value) ? value : []
      const isObjectArray = arrayValue.length > 0 && typeof arrayValue[0] === 'object'
      const itemType = fieldSchema?.items?.type || (isObjectArray ? 'object' : 'string')
      
      return (
        <div key={pathKey} className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection(pathKey)}
              className="flex items-center gap-1 text-sm font-medium hover:text-primary"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {title}
              <span className="text-xs text-muted-foreground ml-1">({arrayValue.length})</span>
            </button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => addArrayItem(fullPath, itemType)}
              className="h-7 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {!isCollapsed && (
            <div className="space-y-2 pl-4">
              {arrayValue.map((item, index) => (
                <div key={`${pathKey}-${index}`} className="flex gap-2 items-start">
                  <div className="flex-1">
                    {typeof item === 'object' && item !== null ? (
                      <div className="p-3 rounded-md bg-muted/30 space-y-2">
                        {Object.entries(item).map(([itemKey, itemValue]) => (
                          <div key={itemKey} className="flex items-center gap-2">
                            <Label className="text-xs w-24 shrink-0">{itemKey}</Label>
                            <Input
                              value={itemValue as string}
                              onChange={(e) => {
                                const newArray = [...arrayValue]
                                newArray[index] = { ...newArray[index], [itemKey]: e.target.value }
                                updateValue(fullPath, newArray)
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Input
                        type={typeof item === 'number' ? 'number' : 'text'}
                        value={item}
                        onChange={(e) => {
                          const newArray = [...arrayValue]
                          newArray[index] = typeof item === 'number' ? Number(e.target.value) : e.target.value
                          updateValue(fullPath, newArray)
                        }}
                        className="h-8 text-sm"
                      />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeArrayItem(fullPath, index)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    // Object handling - check schema type if value is undefined
    const isObjectType = fieldSchema?.type === 'object' || (typeof value === 'object' && value !== null)
    
    if (isObjectType) {
      // Get properties from schema if value is undefined/null
      const objectValue = value || {}
      const schemaProperties = fieldSchema?.properties || {}
      
      // Combine schema properties with actual data properties
      const allSubKeys = new Set([
        ...Object.keys(schemaProperties),
        ...Object.keys(objectValue)
      ])
      
      return (
        <div key={pathKey} className="space-y-2">
          <button
            onClick={() => toggleSection(pathKey)}
            className="flex items-center gap-1 text-sm font-medium hover:text-primary"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {title}
          </button>
          {!isCollapsed && (
            <div className="pl-4 space-y-3">
              {Array.from(allSubKeys).map((subKey) =>
                renderField(subKey, objectValue[subKey], fullPath, fieldSchema, level + 1)
              )}
            </div>
          )}
        </div>
      )
    }

    // Primitive fields
    const isLongText = typeof value === 'string' && value.length > 100
    
    return (
      <div key={pathKey} className="flex items-center gap-3">
        <Label className="text-sm w-32 shrink-0">{title}</Label>
        <div className="flex-1">
          {typeof value === 'boolean' ? (
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => updateValue(fullPath, checked)}
            />
          ) : isLongText ? (
            <Textarea
              value={value}
              onChange={(e) => updateValue(fullPath, e.target.value)}
              className="min-h-[60px] text-sm"
            />
          ) : (
            <Input
              type={typeof value === 'number' ? 'number' : 'text'}
              value={value ?? ''}
              onChange={(e) => {
                const newValue = typeof value === 'number' ? Number(e.target.value) : e.target.value
                updateValue(fullPath, newValue)
              }}
              className="h-9 text-sm"
            />
          )}
        </div>
      </div>
    )
  }, [collapsedSections, getPropertyTitle, toggleSection, addArrayItem, removeArrayItem, updateValue])

  // Get all properties from schema, not just what exists in formData
  const allProperties = useMemo(() => {
    if (!schema?.properties) return []
    
    const schemaKeys = Object.keys(schema.properties)
    const dataKeys = memoizedFormData ? Object.keys(memoizedFormData) : []
    
    // Combine schema keys with data keys (in case data has extra fields not in schema)
    const allKeys = new Set([...schemaKeys, ...dataKeys])
    
    return Array.from(allKeys).map(key => ({
      key,
      value: memoizedFormData?.[key],
      inSchema: schemaKeys.includes(key)
    }))
  }, [schema, memoizedFormData])

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {allProperties.map(({ key, value }) =>
          renderField(key, value, [], schema, 0)
        )}
      </div>
    </ScrollArea>
  )
}
