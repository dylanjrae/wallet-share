// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

const cov_key = process.env.COVALENT_KEY;
const cov_req_headers = new Headers();
cov_req_headers.set('Authorization', 'Bearer ' + cov_key);

type Data = {
  ChainDataResponse: CovalentResponseData;
  ChainStatusResponse: CovalentResponseData;
}

type ChainData = {
  name: string;
  logo_url: string;
};

type ChainStatusData = {
  name: string;
  synced_block_height: number;
};

type CovalentResponseData = {
  chain: ChainData[];
  chain_status: ChainStatusData[];
};


type RawCovalentResponse = {
  data: {
    updated_at: string;
    items: any[];
  };
  error: boolean;
  error_message: null | string;
  error_code: null | string;
};


async function fetchChainData(): Promise<ChainData[]> {
  const response = await fetch('https://api.covalenthq.com/v1/chains/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data');
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: ChainData[] = rawResult.data.items;
  return res;
}

async function fetchChainStatusList(): Promise<ChainStatusData[]> {
  const response = await fetch('https://api.covalenthq.com/v1/chains/status/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data');
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: ChainStatusData[] = rawResult.data.items;
  return res;
}

async function fetchCovalentData(): Promise<CovalentResponseData> {
    const [chains, chainStatuses] = await Promise.all([
      fetchChainData(),
      fetchChainStatusList()
    ]);


    const res:CovalentResponseData = {
        chain: chains,
        chain_status: chainStatuses
    };

    return res;
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CovalentResponseData>
) {
    const covalentData:CovalentResponseData = await fetchCovalentData();

    res.status(200).json(covalentData);
}