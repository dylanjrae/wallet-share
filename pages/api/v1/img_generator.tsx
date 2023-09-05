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

const SVGWrapper = ({ height, width, children }: SVGProps) => {
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

const ChainLogo = ({img, size}: {img: string, size: number}) => {
    return (
        <image xlinkHref={img} width={size} height={size} />
    );
};

const ChainCounter = ({userConfig, covalentData, logos}: CardContentProps) => {
    const chainLogos: JSX.Element[] = [];
    const chainCount: number = covalentData.chainActivity.length;    
    const logoCount: number = Math.min(9, logos.size);
    var i: number = 0;

    for (let [key, value] of logos) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        chainLogos.push(
            <Translate x={col * 20} y={row * 20}>
                <ChainLogo key={key} img={value} size={15} />
            </Translate>
        );
        i++;
        if (i >= 9) break;
    }
    
    return (
        <g>
            <text font-size="16">
                {chainCount} {chainCount === 1 ? 'Chain' : 'Chains'}
            </text>
            <Translate x={15} y= {20}>
                {chainLogos}
            </Translate>
        </g>
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

type CardContentProps = {
    userConfig: UserConfig;
    covalentData: CovalentBatchResponseData;
    logos: Map<string, string>;
};

const CardContent = ({userConfig, covalentData, logos}: CardContentProps) => {
    const chainInfo: ChainInfo = findChainByChainName(userConfig.chain, covalentData.chainInfos);
    const chainLabel: string = chainInfo.label;

    return (
        <g dominant-baseline="text-before-edge" text-anchor="start" fill={userConfig.fillColor} font-family={userConfig.fontFamily}>
            <Address userConfig={userConfig} covalentData={covalentData} />
            <Translate x={295} y={0}>
                <ChainCounter userConfig={userConfig} covalentData={covalentData} logos={logos}/>
            </Translate>
            <Translate x={0} y={0}>
                <ActivitySummary userConfig={userConfig} covalentData={covalentData} />
            </Translate>
            {/* <Translate x={0} y={0}> */}
                {/* <NetWorthDisplay userConfig={userConfig} covalentData={covalentData} /> */}
            {/* </Translate> */}
            
        </g>
    );
};

const Background = () => {
    return (
        <g>
            <rect width="100%" height="100%" rx="12" ry="12" fill="0x151515">
                <animate attributeName="fill" values="#808080; #151515; #808080" dur="3s" repeatCount="indefinite" />
            </rect>

            <Translate x={4.5} y={3}>
                <rect width="98%" height="96%" rx="10" ry="10" fill="0x151515">
                </rect> 
            </Translate>
        </g>
        
    );
};

function buildSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseData, logos: Map<string, string>): string {
    const height: number = 150;
    const width: number = 450;

    const svg: string = renderToStaticMarkup(
        <SVGWrapper height={height} width={width}>
            <Background />

            <Translate x={36} y={30}>
                <CardContent userConfig={userConfig} covalentData={covalentData} logos={logos}/>
            </Translate>
        </SVGWrapper>
    );

    return svg;
}

async function fetchBase64Image(url: string): Promise<string> {
    const response = await fetch(url);
    const imageBlob = await response.blob();
    const base64Image = btoa(await imageBlob.text());
  
    return `data:image/svg+xml;base64,${base64Image}`;
  }

async function fetchChainLogos(covalentData: CovalentBatchResponseData): Promise<Map<string, string>> {
    const logos: Map<string, string> = new Map<string, string>();

    for (const event of covalentData.chainActivity) {
        const base64Image = await fetchBase64Image(event.logo_url);
        logos.set(event.name, base64Image);
    }

    return logos;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<string>
  ) {
      const userConfig: UserConfig = new UserConfig(req);
      const covalentData: CovalentBatchResponseData = await fetchCovalentData(userConfig, covaClient);
      const logos: Map<string, string> = await fetchChainLogos(covalentData);

      //preprocess logos or other async info here with await and pass in separately
      
      const svg: string = buildSVG(userConfig, covalentData, logos);
  
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
  }