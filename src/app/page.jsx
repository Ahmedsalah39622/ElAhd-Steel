import { redirect } from 'next/navigation'

export default function Page() {
  // Always redirect root to login; middleware will still protect other routes.
  redirect('/login')
}
