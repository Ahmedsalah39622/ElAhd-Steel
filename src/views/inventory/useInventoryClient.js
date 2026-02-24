import { useCallback } from 'react'

export function useInventoryClient() {
  const fetchMaterials = useCallback(async (options = {}) => {
    const qs = new URLSearchParams()
    qs.set('_t', Date.now())
    if (options.type) qs.set('type', options.type)
    if (options.action) qs.set('action', options.action)

    const res = await fetch(`/api/inventory?${qs.toString()}`, { credentials: 'include' })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch materials')
      return data
    }
    // Non-JSON response (likely HTML error) — return text to help debugging
    const text = await res.text()
    throw new Error(text || 'Failed to fetch materials')
  }, [])

  const createMaterial = useCallback(
    async ({
      name,
      sku,
      unit,
      materialType,
      createdBy,
      materialName,
      grade,
      initialQuantity,
      supplierId,
      length,
      width,
      count,
      weight,
      type = 'material',
      note,
      dimensionType,
      thickness
    }) => {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name,
          sku,
          unit,
          materialType,
          createdBy,
          materialName,
          grade,
          initialQuantity,
          supplierId,
          length,
          width,
          count,
          weight,
          note,
          dimensionType,
          thickness
        })
      })
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to create material')
        return data
      }
      const text = await res.text()
      throw new Error(text || 'Failed to create material')
    },
    []
  )

  const transact = useCallback(
    async ({
      materialId,
      amount,
      action,
      source = 'ui',
      reference = '',
      user = '',
      note = '',
      length = null,
      width = null,
      allowNegative = false,
      clientId = null,
      price = null,
      specificPieceId = null,
      forceNewSheet = false
    }) => {
      const body = { type: 'transaction', materialId, amount, action, source, reference, user, note }
      if (length != null) body.length = length
      if (width != null) body.width = width
      if (allowNegative) body.allowNegative = true
      if (clientId) body.clientId = clientId
      if (price != null) body.price = price
      if (specificPieceId) body.specificPieceId = specificPieceId
      if (forceNewSheet) body.forceNewSheet = true

      const res = await fetch('/api/inventory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const data = await res.json()
        if (!res.ok) {
          const e = new Error(data?.error || 'Transaction failed')
          if (data?.code) e.code = data.code
          if (data?.hint) e.hint = data.hint
          throw e
        }
        return data
      }
      const text = await res.text()
      throw new Error(text || 'Transaction failed')
    },
    []
  )

  const fetchTransactions = useCallback(async materialId => {
    const res = await fetch(`/api/inventory?reportMaterialId=${encodeURIComponent(materialId)}`, {
      credentials: 'include'
    })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch transactions')
      return data
    }
    const text = await res.text()
    throw new Error(text || 'Failed to fetch transactions')
  }, [])

  const deliverProduct = useCallback(async ({ materialId, count, weight, clientId, price, user }) => {
    const res = await fetch('/api/inventory', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'deliver_product',
        materialId,
        countToDeduct: count,
        weightToDeduct: weight,
        client: clientId,
        user,
        price
      })
    })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Delivery failed')
      return data
    }
    const text = await res.text()
    throw new Error(text || 'Delivery failed')
  }, [])

  const deleteMaterial = useCallback(async id => {
    const res = await fetch('/api/inventory', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Delete failed')
      return data
    }
    const text = await res.text()
    throw new Error(text || 'Delete failed')
  }, [])

  const createJobOrder = useCallback(async data => {
    const res = await fetch('/api/job-orders', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to create Job Order')
      return json
    }
    const text = await res.text()
    throw new Error(text || 'Failed to create Job Order')
  }, [])

  const updateJobOrder = useCallback(async (id, data) => {
    const res = await fetch(`/api/job-orders?id=${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to update Job Order')
      return json
    }
    const text = await res.text()
    throw new Error(text || 'Failed to update Job Order')
  }, [])

  const fetchJobOrders = useCallback(async status => {
    const qs = new URLSearchParams()
    if (status) qs.set('status', status)
    const res = await fetch(`/api/job-orders?${qs.toString()}`, { credentials: 'include' })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to fetch Job Orders')
      return json
    }
    const text = await res.text()
    throw new Error(text || 'Failed to fetch Job Orders')
  }, [])
  const deleteTransaction = useCallback(async id => {
    const res = await fetch('/api/inventory', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type: 'transaction' })
    })
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Delete failed')
      return data
    }
    const text = await res.text()
    throw new Error(text || 'Delete failed')
  }, [])

  const issueOrder = useCallback(
    async ({
      materialId,
      countToDeduct,
      weightToDeduct,
      description,
      user,
      jobCard,
      length,
      width,
      selectedRemnantIds
    }) => {
      console.log('=== useInventoryClient.issueOrder INPUT ===', {
        materialId,
        countToDeduct,
        weightToDeduct,
        length,
        width,
        selectedRemnantIds,
        jobCard
      })

      // Clean all values before sending
      const cleanBody = {
        type: 'issue_order',
        materialId: materialId ? Number(materialId) : null,
        countToDeduct: countToDeduct || null,
        weightToDeduct: weightToDeduct || null,
        description: description || '',
        user: user || 'unknown',
        jobCard: jobCard || null,
        length: length || null,
        width: width || null,
        specificPieceId: selectedRemnantIds && selectedRemnantIds.length > 0 ? Number(selectedRemnantIds[0]) : null
      }

      console.log('=== useInventoryClient.issueOrder CLEANED ===', cleanBody)

      const res = await fetch('/api/inventory', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanBody)
      })
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Issue Order failed')
        return data
      }
      const text = await res.text()
      throw new Error(text || 'Issue Order failed')
    },
    []
  )

  const updateMaterial = useCallback(async (id, updates) => {
    const res = await fetch('/api/inventory', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates })
    })

    const ct = res.headers.get('content-type') || ''

    if (ct.includes('application/json')) {
      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'Failed to update material')

      return data
    }

    const text = await res.text()

    throw new Error(text || 'Failed to update material')
  }, [])

  return {
    fetchMaterials,
    createMaterial,
    updateMaterial,
    transact,
    fetchTransactions,
    deliverProduct,
    deleteMaterial,
    deleteTransaction,
    createJobOrder,
    updateJobOrder,
    fetchJobOrders,
    issueOrder
  }
}

export default useInventoryClient
