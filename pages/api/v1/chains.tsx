import type { NextApiRequest, NextApiResponse } from 'next'
import { ChainItem, Client } from '@covalenthq/client-sdk';

if (!process.env.COVALENT_KEY) {
    throw new Error('Missing internally required environment variable.');
}

const cov_key: string = process.env.COVALENT_KEY;
const covaClient: Client = new Client(cov_key);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<string>
  ) {
        const chains: ChainItem[] = (await covaClient.BaseService.getAllChains()).data.items;
        const chainStr = JSON.stringify(chains);
      
      res.status(200).json(JSON.parse(chainStr));
  }