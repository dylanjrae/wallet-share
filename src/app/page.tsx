import { ChainItem } from '@covalenthq/client-sdk';
import ImageForm from '../components/ImageForm';
import { getChains } from '../../utils/get-chains';

export default async function Home() {
  const chains: ChainItem[] = await getChains();

  return (
    <div>
      <main className="flex min-h-screen flex-col items-center justify-between relative">
        <div>
          <h1 className="text-center text-4xl tracking-wide font-mono mt-12">Wallet Card Generator</h1>
          <ImageForm rawChains={JSON.stringify(chains)}/>
        </div>
        <h3 className="absolute bottom-0 mb-5 text-center text-sm font-mono">
          Please visit the docs{' '}
          <a href="https://github.com/dylanjrae/wallet-share" className="underline text-blue-300" target="_blank" rel="noopener noreferrer">
            here
          </a>
          {' '} for more details 🙂
        </h3>
      </main>
    </div>
  )
}
