// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Client } from '@covalenthq/client-sdk';
import { Chains, Quotes } from '@covalenthq/client-sdk/dist/services/Client';
import type { NextApiRequest, NextApiResponse } from 'next'


if (!process.env.COVALENT_KEY) {
  throw new Error('Missing internally required environment variable.');
}
const cov_key: string = process.env.COVALENT_KEY;
const covaClient: Client = new Client(cov_key);

class UserConfig {
  chain: Chains;
  address: string;
  currency: Quotes;
  
  constructor(req: NextApiRequest) {
    this.chain = req.query.chain as Chains ? req.query.chain as Chains : 'eth-mainnet';
    this.address = req.query.address as string ? req.query.address as string : 'demo.eth';
    this.currency = req.query.currency as Quotes ? req.query.currency as Quotes : 'USD';
  }
}

type Balance = {
  contract_decimals: number;
  contract_name: string;
  contract_ticker_symbol: string;
  contract_address: string;
  logo_url: string;
  type: string;
  balance: bigint | null;
  quote_rate: number;
  quote: number;
};

type TransactionSummary = {
  total_count: number;
  earliest_transaction: {
    block_signed_at: Date;
    tx_hash: string;
    tx_detail_link: string;
  }
  latest_transaction: {
    block_signed_at: Date;
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

type CovalentBatchResponseData = {
  address: string;
  chainInfos: ChainInfo[];
  chainActivity: ChainActivityEvent[];
  balances: Balance[];
  transactionSummary: TransactionSummary[];
};

async function fetchCovalentData(userConfig: UserConfig, covaClient: Client): Promise<CovalentBatchResponseData> {
    const [chainsResp, addressActivityResp, balancesResp, transactionSummaryResp] = await Promise.all([
      covaClient.BaseService.getAllChains(),
      covaClient.BaseService.getAddressActivity(userConfig.address),
      covaClient.BalanceService.getTokenBalancesForWalletAddress(userConfig.chain, userConfig.address, { quoteCurrency: userConfig.currency }),
      covaClient.TransactionService.getTransactionSummary(userConfig.chain, userConfig.address),
    ]);

    const res:CovalentBatchResponseData = {
        chainInfos: chainsResp.data.items,
        chainActivity: addressActivityResp.data.items,
        balances: balancesResp.data.items,
        address: balancesResp.data.address,
        transactionSummary: transactionSummaryResp.data.items,
    };

    return res;
}

async function fetchBase64Image(url: string): Promise<string> {
  const response = await fetch(url);
  const imageBlob = await response.blob();
  const base64Image = btoa(await imageBlob.text());

  return `data:image/svg+xml;base64,${base64Image}`;
}

function findChainByChainName(chainName: string, chainInfos: ChainInfo[]): ChainInfo {
  const foundChain: ChainInfo | undefined = chainInfos.find(chain => chain.name === chainName);
  return foundChain ? foundChain : chainInfos[0];
}

function calculateWalletNetWorth(balances: Balance[]): number {
  let netWorth: number = 0;
  balances.forEach(balance => {
    netWorth += balance.quote;
  });
  return netWorth;
}

function formatAsCurrency(amount: number, currencyCode: string ): string {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);

  return formattedNumber;
}

async function buildSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseData): Promise<string> {
  const userSuppliedAddress: string = userConfig.address;
  const isNonstandardAddress: boolean = covalentData.address != userSuppliedAddress.toLowerCase();
  const chainInfo: ChainInfo = findChainByChainName(userConfig.chain, covalentData.chainInfos);
  const chainLabel: string = chainInfo.label;
  const chainLogoUrl: string = await fetchBase64Image(chainInfo.logo_url);
  const txCount: number = covalentData.transactionSummary != undefined ? covalentData.transactionSummary[0].total_count : 0;
  const chainCount: number = covalentData.chainActivity.length;
  const firstActivityDate: Date | undefined = covalentData.transactionSummary != undefined ? new Date(covalentData.transactionSummary[0].earliest_transaction.block_signed_at) : undefined;
  const firstActivityStr: string = firstActivityDate != undefined ? firstActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const lastActivityDate: Date | undefined = covalentData.transactionSummary != undefined ? new Date(covalentData.transactionSummary[0].latest_transaction.block_signed_at) : undefined;
  const lastActivityStr: string = lastActivityDate != undefined ? lastActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const netWorth: string = formatAsCurrency(calculateWalletNetWorth(covalentData.balances), userConfig.currency);

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

      <svg x="1%" y="50%">
        <text x="0%" y="0%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="22">
          Net Worth
        </text>

        <text x="5%" y="10%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="14">
          ${netWorth}
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
    const covalentData: CovalentBatchResponseData = await fetchCovalentData(userConfig, covaClient);
    
    const svg: string = await buildSVG(userConfig, covalentData);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
}
