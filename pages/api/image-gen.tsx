// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

const cov_key = process.env.COVALENT_KEY;
const cov_req_headers = new Headers();
cov_req_headers.set('Authorization', 'Bearer ' + cov_key);

class UserConfig {
  chain: string;
  address: string;
  currency: string;
  
  constructor(req: NextApiRequest) {
    this.chain = req.query.chain as string ? req.query.chain as string : 'eth-mainnet';
    this.address = req.query.address as string ? req.query.address as string : 'demo.eth';
    this.currency = req.query.currency as string ? req.query.currency as string : 'USD';
  }
}

type Balance = {
  contract_decimals: number;
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  logo_url: string;
  type: string;
  balance: number;
  quote_rate: number;
  quote: number;
};

type TransactionSummary = {
  count: number;
  earliest: {
    block_signed_at: Date;
    tx_hash: string;
    tx_detail_link: string;
  }
  latest: {
    block_signed_at: Date;
    tx_hash: string;
    tx_detail_link: string;
  };
}

type ChainInfo = {
  name: string;
  logo_url: string;
};

type ChainStatus = {
  name: string;
  synced_block_height: number;
};

type CovalentResponseData = {
  chainInfos: ChainInfo[];
  chainStatuses: ChainStatus[];
  balances: Balance[];
  transactionSummary: TransactionSummary[];
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


async function fetchChainInfo(): Promise<ChainInfo[]> {
  const response = await fetch('https://api.covalenthq.com/v1/chains/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data');
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: ChainInfo[] = rawResult.data.items;
  return res;
}

async function fetchChainStatus(): Promise<ChainStatus[]> {
  const response = await fetch('https://api.covalenthq.com/v1/chains/status/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data');
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: ChainStatus[] = rawResult.data.items;
  return res;
}

async function fetchBalances(userConfig: UserConfig): Promise<Balance[]> {
  const response = await fetch('https://api.covalenthq.com/v1/' + userConfig.chain + '/address/' + userConfig.address + '/balances_v2/?quote-currency=' + userConfig.currency, {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data');
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: Balance[] = rawResult.data.items;
  return res;
}

async function fetchTransactionSummary(userConfig: UserConfig): Promise<TransactionSummary[]> {
  const response = await fetch('https://api.covalenthq.com/v1/' + userConfig.chain + '/address/' + userConfig.address + '/transactions_summary/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data');
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: TransactionSummary[] = rawResult.data.items;
  return res;
}

async function fetchCovalentData(userConfig: UserConfig): Promise<CovalentResponseData> {
    const [chains, chainStatuses, balances, transactionSummary] = await Promise.all([
      fetchChainInfo(),
      fetchChainStatus(),
      fetchBalances(userConfig),
      fetchTransactionSummary(userConfig)
    ]);

    const res:CovalentResponseData = {
        chainInfos: chains,
        chainStatuses: chainStatuses,
        balances: balances,
        transactionSummary: transactionSummary
    };

    return res;
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CovalentResponseData>
) {
    const userConfig: UserConfig = new UserConfig(req);
    const covalentData:CovalentResponseData = await fetchCovalentData(userConfig);

    res.status(200).json(covalentData);
}