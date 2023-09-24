import { ChainItem, Client } from '@covalenthq/client-sdk';
import { cache } from 'react'

if (!process.env.COVALENT_KEY) {
    throw new Error('Missing internally required environment variable.');
}

const cov_key: string = process.env.COVALENT_KEY;
const covaClient: Client = new Client(cov_key);
 

export const revalidate = 43200; // revalidate the data at most every 12 hours
 
export const getChains = cache(async () => {
  const chains: ChainItem[] = (await covaClient.BaseService.getAllChains()).data.items;
  return chains;
});
