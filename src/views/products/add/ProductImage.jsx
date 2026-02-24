'use client'

// React Imports
import { useState, useRef } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// Component Imports
import Link from '@components/Link'
import CustomAvatar from '@core/components/mui/Avatar'

const ProductImage = () => {
  // States
  const [files, setFiles] = useState([])
  const fileInputRef = useRef(null)

  const handleFileSelect = e => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const renderFilePreview = file => {
    if (file.type.startsWith('image')) {
      return <img width={38} height={38} alt={file.name} src={URL.createObjectURL(file)} />
    } else {
      return <i className='tabler-file-description' />
    }
  }

  const handleRemoveFile = index => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const fileList = files.map((file, index) => (
    <ListItem key={index} className='pis-4 plb-3'>
      <div className='flex gap-4 flex-1 items-center'>
        <div className='file-preview'>{renderFilePreview(file)}</div>
        <div>
          <Typography className='file-name font-medium' color='text.primary'>
            {file.name}
          </Typography>
          <Typography className='file-size' variant='body2'>
            {Math.round(file.size / 100) / 10 > 1000
              ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} mb`
              : `${(Math.round(file.size / 100) / 10).toFixed(1)} kb`}
          </Typography>
        </div>
      </div>
      <IconButton onClick={() => handleRemoveFile(index)}>
        <i className='tabler-x text-xl' />
      </IconButton>
    </ListItem>
  ))

  const handleRemoveAllFiles = () => {
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader
        title='Product Image'
        action={
          <Typography component={Link} color='primary.main' className='font-medium'>
            Add media from URL
          </Typography>
        }
        sx={{ '& .MuiCardHeader-action': { alignSelf: 'center' } }}
      />
      <CardContent>
        <Box
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 1,
            p: 6,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover'
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type='file'
            multiple
            accept='image/*'
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <div className='flex items-center flex-col gap-2'>
            <CustomAvatar variant='rounded' skin='light' color='secondary'>
              <i className='tabler-upload' />
            </CustomAvatar>
            <Typography variant='h4'>Drag and Drop Your Image Here.</Typography>
            <Typography color='text.disabled'>or</Typography>
            <Button variant='tonal' size='small'>
              Browse Image
            </Button>
          </div>
        </Box>
        {files.length ? (
          <>
            <List>{fileList}</List>
            <div className='flex gap-2'>
              <Button color='error' variant='tonal' onClick={handleRemoveAllFiles}>
                Remove All
              </Button>
              <Button variant='contained'>Upload Files</Button>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default ProductImage
