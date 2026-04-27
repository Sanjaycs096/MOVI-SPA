import { useEffect, useState } from 'react'
import { apiGet } from '../api/apiClient.js'

export default function usePageHistory(pageKey, isOpen) {
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!isOpen) return
    apiGet(`/api/history/${pageKey}`)
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
  }, [pageKey, isOpen])

  return items
}
