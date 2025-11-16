'use client'

import { useState } from 'react'

export function useClipboard() {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setError(null)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to copy'))
      setCopied(false)
    }
  }

  return { copy, copied, error }
}

