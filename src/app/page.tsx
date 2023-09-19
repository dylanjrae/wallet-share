import Image from 'next/image'
import Head from 'next/head'
import { API_URL } from '../../helpers';
import { ChainItem } from '@covalenthq/client-sdk';
import ImageForm from '../components/ImageForm';

async function fetchChainsFromCovalent() {
  const covalentChainsResponse = await fetch(`${API_URL}/api/v1/chains/`);
  const data = await covalentChainsResponse.json();
  return data;
}

export async function getStaticProps() {
  const chainList = await fetchChainsFromCovalent();
  return { props: { chainList } };
}

export default function Home({ chains }: {chains: ChainItem[]}) {
  return (
    <div>
      <main className="flex min-h-screen flex-col items-center justify-between">
        <div>
          <h1 className="text-center text-4xl tracking-wide font-mono mt-12">Wallet Card Generator</h1>
          <ImageForm chains={chains}/>
        </div>
      </main>
    </div>
  )
}
