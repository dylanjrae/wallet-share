import type { NextApiRequest, NextApiResponse } from 'next'
import { renderToStaticMarkup } from 'react-dom/server';
import { ReactNode } from 'react';
import { BalanceItem, ChainActivityEvent, ChainItem, Client, TransactionsSummary } from '@covalenthq/client-sdk';
import { Chains, Quotes } from '@covalenthq/client-sdk/dist/services/Client';


if (!process.env.COVALENT_KEY) {
  throw new Error('Missing internally required environment variable.');
}
const cov_key: string = process.env.COVALENT_KEY;
const covaClient: Client = new Client(cov_key);

export class UserConfig {
  chain: Chains | 'all-chains';
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

type ChainInfo = {
  name: string;
  logo_url: string;
  label: string;
};

export type CovalentBatchResponseData = {
  address: string;
  chainItems: ChainItem[];
  chainActivity: ChainActivityEvent[] | [];
  balances: Map<Chains, BalanceItem[]>;
  transactionSummary: Map<Chains, TransactionsSummary[]>;
};

async function fetchCovalentDataAllChains(userConfig: UserConfig, covaClient: Client): Promise<CovalentBatchResponseData> {
    const [chainsResp, addressActivityResp] = await Promise.all([
        covaClient.BaseService.getAllChains(),
        covaClient.BaseService.getAddressActivity(userConfig.address)
    ]);
    
    const chainList: Chains[] = [];
    for (const activityItem of addressActivityResp.data.items) {
        const chain: Chains = activityItem.name as Chains;
        chainList.push(chain);
    }

    const balancesRes: Map<Chains, BalanceItem[]> = new Map<Chains, BalanceItem[]>();
    const transactionSummaryRes: Map<Chains, TransactionsSummary[]> = new Map<Chains, TransactionsSummary[]>();
    const resolvedAddress: string = addressActivityResp.data.address;
    for (const chain of chainList) {
        const[transactionSummaryResp, balancesResp] = await Promise.all([
            covaClient.TransactionService.getTransactionSummary(chain, resolvedAddress),
            covaClient.BalanceService.getTokenBalancesForWalletAddress(chain, resolvedAddress, { quoteCurrency: userConfig.currency })
        ]);

        balancesRes.set(chain, balancesResp.data.items);
        if (transactionSummaryResp.data != null) {
            transactionSummaryRes.set(chain, transactionSummaryResp.data.items);
        }
    }

    const res:CovalentBatchResponseData = {
        chainItems: chainsResp.data.items,
        chainActivity: addressActivityResp.data.items,
        balances: balancesRes,
        address: resolvedAddress,
        transactionSummary: transactionSummaryRes,
    };

    return res;
}
  
function findChainByChainName(chainName: string, chainItems: ChainItem[]): ChainItem {
  const foundChain: ChainItem | undefined = chainItems.find(chain => chain.name === chainName);
  return foundChain ? foundChain : chainItems[0];
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
    const ellipsis = '...';
    const maxChars = 30;

    const truncateMiddle = (input: string, chars: number, ellipsis: string) => {
        return input.length > chars ? 
            input.substring(0, chars/2) + ellipsis + input.substring(input.length-chars/2) : 
            input;
    }

    const displayAddress = truncateMiddle(userConfig.address, maxChars, ellipsis);
    const displayCovalentAddress = isNonstandardAddress ? truncateMiddle(covalentData.address, maxChars, ellipsis) : '';

    return (
        <g>
            <text fontSize="{userSuppliedAddress.length >= 42 ? '14' : '19'}" >
                {displayAddress}
            </text>

            <Translate x={5.25} y={18}>
                <text fontSize="10" >
                    {displayCovalentAddress}
                </text>
            </Translate>
        </g>
    );
};

const ChainLogo = ({img, size, link}: {img: string, size: number, link: string}) => {
    return (
        link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            <image xlinkHref={img} width={size} height={size} />
          </a>
        ) : (
          <image xlinkHref={img} width={size} height={size} />
        )
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
        // const x = maxX - (col * 20);
        const blockScannerLink = generateBlockScannerLink(key, covalentData.address)
        chainLogos.push(
            <Translate key={"translate-"+key} x={col * 20} y={row * 20}>
                <ChainLogo key={"chainlogo-"+key} img={value} size={15} link={blockScannerLink}/>
            </Translate>
        );
        i++;
        if (i >= 9) break;
    }
    
    return (
        <g>
            <text fontSize="16" textAnchor='end'>
                {chainCount} {chainCount === 1 ? 'Chain' : 'Chains'}
            </text>
            <Translate x={-58} y= {22}>
                {chainLogos}
            </Translate>
        </g>
    );
};

function calculateTotalTxCount(covalentData: CovalentBatchResponseData): number {
    let txCount: number = 0;
    for (let [key, value] of covalentData.transactionSummary) {
        txCount += value[0].total_count;
    }
    return txCount;
}

function calculateEarliestDate(covalentData: CovalentBatchResponseData): string {
    let earliestDate: Date | undefined = undefined;
    for (let [key, value] of covalentData.transactionSummary) {
        const chainEarliestDate: Date = new Date(value[0].earliest_transaction.block_signed_at);
        if (earliestDate == undefined || chainEarliestDate < earliestDate) {
            earliestDate = chainEarliestDate;

        }
    }

    let earliestDateStr: string = '';
    if (earliestDate != undefined) {
        earliestDateStr = earliestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    }

    return earliestDateStr;
}

function calculateLatestDate(covalentData: CovalentBatchResponseData): string {
    let latestDate: Date | undefined = undefined;
    for (let [key, value] of covalentData.transactionSummary) {
        const chainLatestDate: Date = new Date(value[0].latest_transaction.block_signed_at);
        if (latestDate == undefined || chainLatestDate > latestDate) {
            latestDate = chainLatestDate;
        }
    }

    let latestDateStr: string = '';
    if (latestDate != undefined) {
        latestDateStr = latestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    }

    return latestDateStr;
}

const ActivitySummary = ({userConfig, covalentData}: {userConfig: UserConfig, covalentData: CovalentBatchResponseData}) => {
    const txCount: number = calculateTotalTxCount(covalentData);
    const firstActivityStr: string = calculateEarliestDate(covalentData);;
    const lastActivityStr: string = calculateLatestDate(covalentData);

    return (
        <g>
            <Translate x={0} y={0}>
                <text fontSize="16">
                    {txCount}
                </text>
            </Translate>
        
            <Translate x={0} y={18}>
                <text fontSize="12">
                    {txCount === 1 ? 'Transaction' : 'Transactions'}
                </text>
            </Translate>

            <Translate x={0} y={34}>
                <text fontSize="9">
                    {lastActivityStr ? `Last activity: ${lastActivityStr}` : ''}
                </text>
            </Translate>
      </g>
    );
};

function calculateWalletNetWorth(balances: Map<Chains, BalanceItem[]>): number {
    let netWorth: number = 0;
    for (let [key, value] of balances) {
        value.forEach(balance => {
            netWorth += balance.quote;
          });
    }
    
    return netWorth;
};

function formatAsCurrency(amount: number, currencyCode: string ): string {
    const formattedNumber = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  
    return formattedNumber;
  }

const NetWorthDisplay = ({userConfig, covalentData}: {userConfig: UserConfig, covalentData: CovalentBatchResponseData}) => {
    const netWorth: string = formatAsCurrency(calculateWalletNetWorth(covalentData.balances), userConfig.currency);

    return (
        <text fontSize="18" textAnchor="end">
            {netWorth}
        </text>
    );
};

type CardContentProps = {
    userConfig: UserConfig;
    covalentData: CovalentBatchResponseData;
    logos: Map<string, string>;
};

const CardContent = ({userConfig, covalentData, logos}: CardContentProps) => {
    const chainItem: ChainInfo = findChainByChainName(userConfig.chain, covalentData.chainItems);
    const chainLabel: string = chainItem.label;

    return (
        <g dominantBaseline="text-before-edge" textAnchor="start" fill={userConfig.fillColor} fontFamily={userConfig.fontFamily}>
            <Address userConfig={userConfig} covalentData={covalentData} />
            <Translate x={380} y={0}>
                <ChainCounter userConfig={userConfig} covalentData={covalentData} logos={logos}/>
            </Translate>
            <Translate x={0} y={100}>
                <ActivitySummary userConfig={userConfig} covalentData={covalentData} />
            </Translate>
            <Translate x={380} y={125}>
                <NetWorthDisplay userConfig={userConfig} covalentData={covalentData} />
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

            <Translate x={4.5} y={3}>
                <rect width="98%" height="96%" rx="10" ry="10" fill="0x151515">
                </rect> 
            </Translate>
        </g>
        
    );
};

function buildSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseData, logos: Map<string, string>): string {
    const height: number = 200;
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

const blockScannerAddressLinks: Map<string, string> = new Map<string, string>([
    ["eth-mainnet", "https://etherscan.io/address/"],
    ["matic-mainnet", "https://polygonscan.com/address/"],
    ["bsc-mainnet", "https://bscscan.com/address/"],
    ["avalanche-mainnet", "https://avascan.info/blockchain/c/address/"],
    ["fantom-mainnet", "https://ftmscan.com/address/"],
    ["zora-mainnet", "https://explorer.zora.energy/address/"],
    ["arbitrum-nova-mainnet", "https://nova.arbiscan.io/address/"],
    ["arbitrum-mainnet", "https://arbiscan.io/address/"],
    ["moonbeam-moonriver", "https://moonscan.io/address/"],
    ["optimism-mainnet", "https://optimistic.etherscan.io/address/"],
    ["linea-mainnet", "https://lineascan.build/address/"],
    ["base-mainnet", "https://basescan.org/address/"],
    ["mantle-mainnet", "https://mantlescan.info/address/"],
]);

function generateBlockScannerLink(chainName: string, address: string): string {
    if (blockScannerAddressLinks.has(chainName)) {
        return blockScannerAddressLinks.get(chainName) + address;
    }

    return "";
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<string>
  ) {
      const userConfig: UserConfig = new UserConfig(req);
      const covalentData: CovalentBatchResponseData = await fetchCovalentDataAllChains(userConfig, covaClient);
      const logos: Map<string, string> = await fetchChainLogos(covalentData);
      
      const svg: string = buildSVG(userConfig, covalentData, logos);
  
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
  }