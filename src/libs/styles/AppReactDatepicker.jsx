import { styled } from '@mui/material/styles'
import ReactDatePicker from 'react-datepicker'

const AppReactDatepicker = styled(ReactDatePicker)(({ theme }) => ({
  '& .react-datepicker__input-container': {
    width: '100%'
  },
  '& .react-datepicker-wrapper': {
    width: '100%'
  },
  '& .react-datepicker__popper': {
    zIndex: 1301
  },
  '& .react-datepicker__calendar-icon': {
    right: theme.spacing(1)
  }
}))

export default AppReactDatepicker
