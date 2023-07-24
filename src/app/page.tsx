import Image from 'next/image'
import ImageForm from '../components/ImageForm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div>
        <h1 className="text-center text-4xl tracking-wide font-mono mt-12">Wallet Card Generator</h1>
        <ImageForm />
      </div>
    </main>
  )
}
