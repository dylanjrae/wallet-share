import { ChainItem } from '@covalenthq/client-sdk';
import ImageForm from '../components/ImageForm';
import { getChains } from '../../utils/get-chains';

export default async function Home() {
  const chains: ChainItem[] = await getChains();

  return (
    <div>
      <main className="flex min-h-screen flex-col items-center justify-between">
        <div>
          <h1 className="text-center text-4xl tracking-wide font-mono mt-12">Wallet Card Generator</h1>
          <ImageForm rawChains={JSON.stringify(chains)}/>
        </div>
      </main>
    </div>
  )
}
