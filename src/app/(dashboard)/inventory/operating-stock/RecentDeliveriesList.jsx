'use client'
import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CustomAvatar from '@core/components/mui/Avatar'
import Chip from '@mui/material/Chip'

const RecentDeliveriesList = ({ client }) => {
    const [deliveries, setDeliveries] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                // Assuming fetchTransactions allows filtering or we just fetch general recent relevant ones
                // Since we don't have a direct 'recent deliveries' endpoint fully wired yet in the client hook,
                // we will fetch via direct API call with action='deliveries' which we just added
                const res = await fetch('/api/inventory?action=deliveries')
                const data = await res.json()
                if (Array.isArray(data)) setDeliveries(data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) return <Typography variant="body2">جاري التحميل...</Typography>
    if (deliveries.length === 0) return <Typography variant="body2" color="text.secondary">لا توجد عمليات تسليم حديثة</Typography>

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {deliveries.slice(0, 5).map((tx) => (
                <Box key={tx.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                     <CustomAvatar skin='light' color='success' size={38} variant="rounded">
                        <i className='tabler-arrow-right' />
                     </CustomAvatar>
                     <Box sx={{ flexGrow: 1 }}>
                         <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                             {tx.Material?.name || 'منتج غير معروف'}
                         </Typography>
                         <Typography variant="caption" color="text.secondary">
                             {new Date(tx.createdAt).toLocaleDateString('ar-EG')}
                         </Typography>
                     </Box>
                     <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                            {Math.abs(tx.change)} {tx.Material?.unit}
                        </Typography>
                     </Box>
                </Box>
            ))}
        </Box>
    )
}

export default RecentDeliveriesList
