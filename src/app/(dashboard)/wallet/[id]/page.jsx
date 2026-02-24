import WalletDetailClient from 'src/views/WalletDetail'
export default async function WalletDetailPage({ params }) {
  // `params` can be a thenable in Next.js app router; await to get plain values
  const resolved = await params
  const id = resolved && resolved.id ? String(resolved.id) : ''
  return <WalletDetailClient id={id} />
}
