import Link from 'next/link'
export default function Home(){
  return (
    <div style={{padding:24}}>
      <h1>WarriorPixel Esports</h1>
      <p>Tournaments • Highlights • Wallet</p>
      <div style={{marginTop:12}}>
        <Link href="/tournaments"><a style={{marginRight:8}}>Browse Tournaments</a></Link>
        <Link href="/wallet"><a>Wallet</a></Link>
      </div>
    </div>
  )
}
