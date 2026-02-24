// Component Imports
import ResetPasswordV2 from '@views/ResetPasswordV2'
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata = {
  title: 'Reset Password',
  description: 'Reset your password'
}

const ResetPasswordPage = async () => {
  const mode = await getServerMode()

  return <ResetPasswordV2 mode={mode} />
}

export default ResetPasswordPage
