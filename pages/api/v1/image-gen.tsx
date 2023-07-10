// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import build from 'next/dist/build';

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
  total_count: number;
  earliest_transaction: {
    block_signed_at: string;
    tx_hash: string;
    tx_detail_link: string;
  }
  latest_transaction: {
    block_signed_at: string;
    tx_hash: string;
    tx_detail_link: string;
  };
}

type ChainInfo = {
  name: string;
  logo_url: string;
  label: string;
};

type ChainActivityEvent = ChainInfo & {
  last_seen_at: Date;
};

type ChainStatus = {
  name: string;
  synced_block_height: number;
};

type CovalentBatchResponseData = {
  address: string;
  chainInfos: ChainInfo[];
  chainActivity: ChainActivityEvent[];
  balances: Balance[];
  transactionSummary: TransactionSummary[];
};

type RawCovalentResponse = {
  data: CovalentResponseData;
  error: boolean;
  error_message: null | string;
  error_code: null | string;
};

type CovalentResponseData = {
  updated_at: string;
  address: string;
  items: any[];
}


async function fetchChainInfo(): Promise<CovalentResponseData> {
  const response = await fetch('https://api.covalenthq.com/v1/chains/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: CovalentResponseData = rawResult.data;
  return res;
}

async function fetchChainStatus(): Promise<CovalentResponseData> {
  const response = await fetch('https://api.covalenthq.com/v1/chains/status/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: CovalentResponseData = rawResult.data;
  return res;
}

async function fetchBalances(userConfig: UserConfig): Promise<CovalentResponseData> {
  const response = await fetch('https://api.covalenthq.com/v1/' + userConfig.chain + '/address/' + userConfig.address + '/balances_v2/?quote-currency=' + userConfig.currency, {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: CovalentResponseData = rawResult.data;
  return res;
}

async function fetchTransactionSummary(userConfig: UserConfig): Promise<CovalentResponseData> {
  const response = await fetch('https://api.covalenthq.com/v1/' + userConfig.chain + '/address/' + userConfig.address + '/transactions_summary/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: CovalentResponseData = rawResult.data;
  return res;
}

async function fetchChainActivity(userConfig: UserConfig): Promise<CovalentResponseData> {
  const response = await fetch('https://api.covalenthq.com/v1/labs/activity/' + userConfig.address + '/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: CovalentResponseData = rawResult.data;
  return res;
}

async function fetchCovalentData(userConfig: UserConfig): Promise<CovalentBatchResponseData> {
    const [chainsResp, chainActivityResp, balancesResp, transactionSummaryResp] = await Promise.all([
      fetchChainInfo(),
      fetchChainActivity(userConfig),
      fetchBalances(userConfig),
      fetchTransactionSummary(userConfig),
    ]);

    const res:CovalentBatchResponseData = {
        chainInfos: chainsResp.items,
        chainActivity: chainActivityResp.items,
        balances: balancesResp.items,
        address: balancesResp.address,
        transactionSummary: transactionSummaryResp.items,
    };

    return res;
}

function findChainByChainName(chainName: string, chainInfos: ChainInfo[]): ChainInfo {
  const foundChain: ChainInfo | undefined = chainInfos.find(chain => chain.name === chainName);
  return foundChain ? foundChain : chainInfos[0];
}

function buildSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseData): string {
  const userSuppliedAddress: string = userConfig.address;
  const isNonstandardAddress: boolean = covalentData.address != userSuppliedAddress.toLowerCase();
  const chainInfo: ChainInfo = findChainByChainName(userConfig.chain, covalentData.chainInfos);
  const chainLabel: string = chainInfo.label;
  const chainLogoUrl: string = chainInfo.logo_url;
  const txCount: number = covalentData.transactionSummary != undefined ? covalentData.transactionSummary[0].total_count : 0;
  const chainCount: number = covalentData.chainActivity.length;
  const firstActivityDate: Date | undefined = covalentData.transactionSummary != undefined ? new Date(covalentData.transactionSummary[0].earliest_transaction.block_signed_at) : undefined;
  const firstActivityStr: string = firstActivityDate != undefined ? firstActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const lastActivityDate: Date | undefined = covalentData.transactionSummary != undefined ? new Date(covalentData.transactionSummary[0].latest_transaction.block_signed_at) : undefined;
  const lastActivityStr: string = lastActivityDate != undefined ? lastActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const svg: string = `
  <svg id="visual" viewBox="0 0 450 300" width="450" height="300" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
    <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="0x151515">
      <animate attributeName="fill" values="#808080; #151515; #808080" dur="3s" repeatCount="indefinite" />
    </rect>

    <rect x="1%" y="1%" width="98%" height="98%" rx="10" ry="10" fill="0x151515">
    </rect> 

    <svg x="8%" y="10%">
      <text x="0%" y="0%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="${userSuppliedAddress.length >= 42 ? '12' : '19'}">
        ${userSuppliedAddress}
      </text>

      <text x="2%" y="7%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
        ${isNonstandardAddress ? covalentData.address : ''}
      </text>

      <text x="5%" y="18%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="14">
        ${chainLabel}
      </text>

      <image xlink:href="${chainLogoUrl}" x="0%" y="18%" width="20" height="20" />

      <text x="70%" y="2%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="16">
        ${chainCount} ${chainCount === 1 ? 'Chain' : 'Chains'}
      </text>

      <svg x="1%" y="24%">
        <text x="0%" y="0%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
          ${txCount} ${txCount === 1 ? 'Transaction' : 'Transactions'}
        </text>

        <text x="0%" y="3.5%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
        ${lastActivityStr ? `Last activity: ${lastActivityStr}` : ''}
        </text>

        <text x="0%" y="7%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
          ${firstActivityStr ? `First activity: ${firstActivityStr}` : ''}
        </text>
      </svg>
    </svg>

  </svg>
  `;
  
  return svg;
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
    const userConfig: UserConfig = new UserConfig(req);
    const covalentData: CovalentBatchResponseData = await fetchCovalentData(userConfig);
    
    const svg: string = buildSVG(userConfig, covalentData);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Security-Policy', "img-src 'self' https://www.datocms-assets.com/86369/");
    res.send(svg);
}
