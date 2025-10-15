import { useState, useCallback } from 'react'
import * as yaml from 'js-yaml'
import type { SecretItem, SortConfig, SecretsFormData } from '@/types/secrets'

export function useSecretsFormManager(_initialContent: string, _onChange: (content: string) => void) {
  const [formData, setFormData] = useState<SecretsFormData>({ env: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSecrets, setSelectedSecrets] = useState<number[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)

  const parseContent = useCallback((content: string) => {
    setIsLoading(true)
    try {
      // Handle empty or null content
      if (!content || !content.trim() || content.trim() === 'null') {
        setFormData({ env: [] })
        return
      }

      const parsed = yaml.load(content) as any
      
      // Handle null or undefined parsed content (yaml.load returns null for "null" string)
      if (!parsed || typeof parsed !== 'object') {
        setFormData({ env: [] })
        return
      }

      // Preserve all fields from the original YAML, not just env
      // But ensure env is always an array
      setFormData({
        ...parsed,
        env: Array.isArray(parsed.env) ? parsed.env : []
      })
    } catch (err) {
      console.error('Failed to parse secrets YAML:', err)
      setFormData({ env: [] })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateYaml = useCallback((data: SecretsFormData): string => {
    try {
      // Ensure we always have the env key, even if empty
      const yamlData = {
        ...data,
        env: data.env || []
      }
      
      return yaml.dump(yamlData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      })
    } catch (err) {
      console.error('Failed to generate YAML:', err)
      return 'env: []\n'
    }
  }, [])

  const updateFormData = useCallback((newData: SecretsFormData) => {
    setFormData(newData)
    // Call onChange to update YAML in real-time
    const yamlContent = generateYaml(newData)
    _onChange(yamlContent)
  }, [_onChange, generateYaml])

  const addSecret = useCallback((secret?: SecretItem): number => {
    const newSecret: SecretItem = secret || {
      name: '',
      vaultRef: {
        path: '',
        key: ''
      }
    }

    const newData = {
      ...formData,
      env: [...(formData.env || []), newSecret]
    }

    updateFormData(newData)
    return newData.env.length - 1
  }, [formData, updateFormData])

  const removeSelectedSecrets = useCallback(() => {
    if (selectedSecrets.length === 0) return

    const newData = {
      ...formData,
      env: formData.env.filter((_, index) => !selectedSecrets.includes(index))
    }

    updateFormData(newData)
    setSelectedSecrets([])
  }, [formData, selectedSecrets, updateFormData])

  const updateSecret = useCallback((index: number, secret: SecretItem) => {
    if (!formData.env || index < 0 || index >= formData.env.length) return

    const newData = {
      ...formData,
      env: formData.env.map((s, i) => i === index ? secret : s)
    }

    updateFormData(newData)
  }, [formData, updateFormData])

  return {
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
  }
}
