import { useState, useEffect } from 'react'
import { KnowledgeItem } from '@/types'

interface UseKnowledgeOptions {
  search?: string
  category?: string
  tags?: string[]
  sortBy?: 'popular' | 'rating' | 'recent'
  autoFetch?: boolean
}

export function useKnowledge(options: UseKnowledgeOptions = {}) {
  const { search = '', category = '', tags = [], sortBy = 'recent', autoFetch = true } = options

  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  const fetchKnowledge = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category && category !== 'all') params.append('category', category)
      if (tags.length > 0) params.append('tags', tags.join(','))
      if (sortBy) params.append('sortBy', sortBy)

      const response = await fetch(`/api/knowledge?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch knowledge')
      }

      const result = await response.json()
      setKnowledge(result.data || [])
      setCount(result.count || 0)
    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching knowledge:', err)
    } finally {
      setLoading(false)
    }
  }

  const createKnowledge = async (data: {
    title: string
    content: string
    category: string
    department: string
    tags?: string[]
  }) => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create knowledge')
      }

      const newKnowledge = await response.json()
      setKnowledge((prev) => [newKnowledge, ...prev])
      return newKnowledge
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateKnowledge = async (id: string, data: Partial<KnowledgeItem>) => {
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update knowledge')
      }

      const updated = await response.json()
      setKnowledge((prev) => prev.map((k) => (k.id === id ? updated : k)))
      return updated
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteKnowledge = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete knowledge')
      }

      setKnowledge((prev) => prev.filter((k) => k.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const incrementUsage = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge/${id}/use`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to increment usage')
      }

      const updated = await response.json()
      setKnowledge((prev) => prev.map((k) => (k.id === id ? updated : k)))
    } catch (err: any) {
      console.error('Error incrementing usage:', err)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchKnowledge()
    }
  }, [search, category, tags.join(','), sortBy, autoFetch])

  return {
    knowledge,
    loading,
    error,
    count,
    fetchKnowledge,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    incrementUsage,
  }
}
