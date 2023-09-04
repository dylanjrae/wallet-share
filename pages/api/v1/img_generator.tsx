import type { NextApiRequest, NextApiResponse } from 'next'
import { renderToStaticMarkup } from 'react-dom/server';
import { ReactNode } from 'react';
import { Client } from '@covalenthq/client-sdk';
import { Chains, Quotes } from '@covalenthq/client-sdk/dist/services/Client';


if (!process.env.COVALENT_KEY) {
  throw new Error('Missing internally required environment variable.');
}
const cov_key: string = process.env.COVALENT_KEY;
const covaClient: Client = new Client(cov_key);

export class UserConfig {
  chain: Chains;
  address: string;
  currency: Quotes;
  fontFamily: string;
  fillColor: string;
  
  constructor(req: NextApiRequest) {
    this.chain = req.query.chain as Chains ? req.query.chain as Chains : 'eth-mainnet';
    this.address = req.query.address as string ? req.query.address as string : 'demo.eth';
    this.currency = req.query.currency as Quotes ? req.query.currency as Quotes : 'USD';
    this.fontFamily = req.query.fontFamily as string ? req.query.fontFamily as string : 'monospace';
    this.fillColor = req.query.fillColor as string ? req.query.fillColor as string : 'white';
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

export type CovalentBatchResponseData = {
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

  
function findChainByChainName(chainName: string, chainInfos: ChainInfo[]): ChainInfo {
  const foundChain: ChainInfo | undefined = chainInfos.find(chain => chain.name === chainName);
  return foundChain ? foundChain : chainInfos[0];
}


type TranslateProps = {
    x?: number;
    y?: number;
    children: ReactNode;
};

const Translate = ({x=0,y=0,children}: TranslateProps) => {
    if (!x && !y) return children;

    return (
        <g transform={`translate(${x},${y})`}>{children}</g>
    );
};

type SVGProps = {
    height: number;
    width: number;
    children: ReactNode;
};

const SVG = ({ height, width, children }: SVGProps) => {
    const viewBoxWidth: number = width;
    const viewBoxHeight: number = height;

    return (
        <svg width={width} height={height} viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            {children}
        </svg>
    );
};

const Address = ({userConfig, covalentData}: {userConfig: UserConfig, covalentData: CovalentBatchResponseData}) => {
    const isNonstandardAddress: boolean = covalentData.address != userConfig.address.toLowerCase();

    return (
        <g>
            <text font-size="{userSuppliedAddress.length >= 42 ? '12' : '19'}" >
                {userConfig.address}
            </text>

            <Translate x={5.25} y={18}>
                <text font-size="10" >
                    {isNonstandardAddress ? covalentData.address : ''}
                </text>
            </Translate>
        </g>
    );
};

const ChainCounter = ({userConfig, covalentData}: {userConfig: UserConfig, covalentData: CovalentBatchResponseData}) => {
    const chainCount: number = covalentData.chainActivity.length;

    return (
        <text font-size="16">
            {chainCount} {chainCount === 1 ? 'Chain' : 'Chains'}
        </text>
    );
};

const ActivitySummary = ({userConfig, covalentData}: {userConfig: UserConfig, covalentData: CovalentBatchResponseData}) => {
    const txCount: number = covalentData.transactionSummary != undefined ? covalentData.transactionSummary[0].total_count : 0;
    const firstActivityDate: Date | undefined = covalentData.transactionSummary != undefined ? new Date(covalentData.transactionSummary[0].earliest_transaction.block_signed_at) : undefined;
    const firstActivityStr: string = firstActivityDate != undefined ? firstActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const lastActivityDate: Date | undefined = covalentData.transactionSummary != undefined ? new Date(covalentData.transactionSummary[0].latest_transaction.block_signed_at) : undefined;
    const lastActivityStr: string = lastActivityDate != undefined ? lastActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

    return (
        <svg x="1%" y="24%">
        <text x="0%" y="0%" font-size="10">
          {txCount} {txCount === 1 ? 'Transaction' : 'Transactions'}
        </text>

        <text x="0%" y="3.5%" font-size="10">
        {lastActivityStr ? `Last activity: ${lastActivityStr}` : ''}
        </text>

        <text x="0%" y="7%" font-size="10">
          {firstActivityStr ? `First activity: ${firstActivityStr}` : ''}
        </text>
      </svg>
    );
};

const CardContent = ({userConfig, covalentData}: {userConfig: UserConfig, covalentData: CovalentBatchResponseData}) => {
    const chainInfo: ChainInfo = findChainByChainName(userConfig.chain, covalentData.chainInfos);
    const chainLabel: string = chainInfo.label;

    return (
        <g dominant-baseline="text-before-edge" text-anchor="start" fill={userConfig.fillColor} font-family={userConfig.fontFamily}>
            <Address userConfig={userConfig} covalentData={covalentData} />
            <Translate x={295} y={0}>
                <ChainCounter userConfig={userConfig} covalentData={covalentData} />
            </Translate>
            <Translate x={0} y={0}>
                <ActivitySummary userConfig={userConfig} covalentData={covalentData} />
            </Translate>
            
        </g>
    );
};

const Background = () => {
    return (
        <g>
            <rect width="100%" height="100%" rx="12" ry="12" fill="0x151515">
                <animate attributeName="fill" values="#808080; #151515; #808080" dur="3s" repeatCount="indefinite" />
            </rect>

            <Translate x={3} y={4.5}>
                <rect width="98%" height="98%" rx="10" ry="10" fill="0x151515">
                </rect> 
            </Translate>
        </g>
        
    );
};

function buildSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseData): string {
    const height: number = 300;
    const width: number = 450;

    const svg: string = renderToStaticMarkup(
        <SVG height={height} width={width}>
            <Background />

            <Translate x={36} y={30}>
                <CardContent userConfig={userConfig} covalentData={covalentData}/>
            </Translate>
        </SVG>
    );

    return svg;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<string>
  ) {
      const userConfig: UserConfig = new UserConfig(req);
      const covalentData: CovalentBatchResponseData = await fetchCovalentData(userConfig, covaClient);
      //preprocess logos or other async info here with await and pass in separately
      
      const svg: string = buildSVG(userConfig, covalentData);
  
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
  }