// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

const statusLabels = {
  draft: 'مسودة',
  sent: 'مرسلة',
  paid: 'مدفوعة',
  cancelled: 'ملغاة'
}

const PreviewActions = ({ id, onButtonClick, invoiceStatus = 'draft', onStatusChange, onDownload, onSend }) => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Button
              fullWidth
              variant='contained'
              className='capitalize'
              startIcon={<i className='tabler-send' />}
              onClick={onSend}
            >
              إرسال الفاتورة
            </Button>
            <Button
              fullWidth
              variant='contained'
              color='secondary'
              className='capitalize'
              startIcon={<i className='tabler-download' />}
              onClick={onDownload}
            >
              تحميل
            </Button>
            <Button
              fullWidth
              variant='tonal'
              color='secondary'
              className='capitalize'
              startIcon={<i className='tabler-printer' />}
              onClick={onButtonClick}
            >
              طباعة
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <TextField
          select
          fullWidth
          label='حالة الفاتورة'
          value={invoiceStatus}
          onChange={e => onStatusChange(e.target.value)}
        >
          <MenuItem value='draft'>مسودة</MenuItem>
          <MenuItem value='sent'>مرسلة</MenuItem>
          <MenuItem value='paid'>مدفوعة</MenuItem>
          <MenuItem value='cancelled'>ملغاة</MenuItem>
        </TextField>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='p-4'>
            <h3 className='font-semibold text-sm mb-3'>تفاصيل الفاتورة</h3>
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span>رقم الفاتورة:</span>
                <span className='font-medium'>{id}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span>الحالة:</span>
                <span className='font-medium capitalize'>{statusLabels[invoiceStatus] || invoiceStatus}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default PreviewActions
