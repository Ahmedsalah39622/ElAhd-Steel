'use client'

import * as React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

export default function MaterialReportDialog({ open, onClose, transactions = [] }) {
  const [suppliersMap, setSuppliersMap] = React.useState({})
  const [clientsMap, setClientsMap] = React.useState({})

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/suppliers', { credentials: 'include' })
        if (!mounted) return
        const json = await res.json()
        const arr = (json && json.data) || []
        const map = {}
        arr.forEach(s => {
          map[String(s.id)] = s.name || s.name === 0 ? s.name : ''
        })
        if (mounted) setSuppliersMap(map)
      } catch (e) {
        console.error('Failed to fetch suppliers for report dialog', e)
      }
    })()
    ;(async () => {
      try {
        const res2 = await fetch('/api/clients', { credentials: 'include' })
        if (!mounted) return
        const json2 = res2.ok ? await res2.json() : null
        const arr2 = (json2 && json2.data) || []
        const cmap = {}
        arr2.forEach(c => {
          cmap[String(c.id)] = c.name || ''
        })
        if (mounted) setClientsMap(cmap)
      } catch (e) {
        console.error('Failed to fetch clients for report dialog', e)
      }
    })()

    return () => (mounted = false)
  }, [])

  return (
    <Dialog open={!!open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Material Transactions</DialogTitle>
      <DialogContent>
        {transactions.length === 0 ? (
          <div>No transactions found.</div>
        ) : (
          <List>
            {transactions.map(tx => {
              const ref = tx.reference || ''
              const supplierName = suppliersMap[String(ref)] || ''
              const who = tx.user || 'unknown'
              const when = new Date(tx.createdAt).toLocaleString()
              const note = tx.note ? ' • ' + tx.note : ''
              let sourceText = ''
              if (tx.source === 'supplier' && supplierName) sourceText = supplierName
              else if (tx.source === 'client') sourceText = clientsMap[String(tx.reference)] || tx.reference || 'client'
              else sourceText = tx.source || ''

              return (
                <ListItem key={tx.id} divider>
                  <ListItemText
                    primary={`${tx.action === 'remove' ? '-' : '+'}${Math.abs(tx.change || 0)} — ${sourceText}`}
                    secondary={`${who} • ${when}${note}`}
                  />
                </ListItem>
              )
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
