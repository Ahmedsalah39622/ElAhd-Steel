import { styled } from '@mui/material/styles'
import Box from '@mui/material/Box'

const AppReactDropzone = styled(Box)(({ theme }) => ({
  '& .dropzone': {
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    border: `2px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.action.hover,
    cursor: 'pointer',
    transition: theme.transitions.create(['background-color', 'border-color']),
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
      borderColor: theme.palette.primary.main
    },
    '&.active': {
      backgroundColor: theme.palette.action.selected,
      borderColor: theme.palette.primary.main
    }
  },
  '& .file-preview': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(2)
  },
  '& .file-details': {
    display: 'flex',
    alignItems: 'center'
  }
}))

export default AppReactDropzone
