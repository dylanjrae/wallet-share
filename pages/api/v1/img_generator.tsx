import type { NextApiRequest, NextApiResponse } from 'next'
import { renderToStaticMarkup } from 'react-dom/server';
import { ReactNode } from 'react';
import { BalanceItem, ChainItem, Client, TransactionsSummary } from '@covalenthq/client-sdk';
import { Chains, Quotes } from '@covalenthq/client-sdk/dist/services/Client';

if (!process.env.COVALENT_KEY) {
  throw new Error('Missing internally required environment variable.');
}
const cov_key: string = process.env.COVALENT_KEY;
const covaClient: Client = new Client(cov_key);

class UserConfig {
  chain: Chains | 'all-chains';
  address: string;
  currency: Quotes;
  fontFamily: string;
  fillColor: string;
  style: CardStyle;
  
  constructor(req: NextApiRequest) {
    this.chain = req.query.chain as Chains ? req.query.chain as Chains : 'all-chains';
    this.address = req.query.address as string ? req.query.address as string : 'demo.eth';
    this.currency = req.query.currency as Quotes ? req.query.currency as Quotes : 'USD';
    this.fontFamily = req.query.fontFamily as string ? req.query.fontFamily as string : 'monospace';
    this.fillColor = req.query.fillColor as string ? req.query.fillColor as string : 'white';
    this.style = req.query.style as CardStyle ? req.query.style as CardStyle : 'standard';
  }
}

type CardStyle = 'standard' | 'tx' | 'tokens' | 'nft';

type CovalentBatchResponseData = {
  address: string;
  userChains: Map<Chains, ChainItem>
  balances: Map<Chains, BalanceItem[]>;
  transactionSummary: Map<Chains, TransactionsSummary[]>;
};

type BalanceItemWithChain = BalanceItem & {
    chain: Chains;
};
type CovalentBatchResponseDataAndTxs = CovalentBatchResponseData & {
    transactions: Map<Chains, Map<string, number>>;
};

async function getUserChains(userConfig: UserConfig, covaClient: Client): Promise<[Map<Chains, ChainItem>, string]> {
    const userChains: Map<Chains, ChainItem> = new Map<Chains, ChainItem>();
    let resolvedAddress: string;
    
    if (userConfig.chain === 'all-chains') {
        const addressActivityResp = await covaClient.BaseService.getAddressActivity(userConfig.address);
        resolvedAddress = addressActivityResp.data.address;
        for (const activityItem of addressActivityResp.data.items) {
            const chain: Chains = activityItem.name as Chains;
            userChains.set(chain, activityItem);
        }
    } else {
        const chainsResp = (await covaClient.BaseService.getAllChains()).data.items;
        resolvedAddress = userConfig.address;
        userChains.set(userConfig.chain, findChainByChainName(userConfig.chain, chainsResp));
    }

    return [userChains, resolvedAddress];
}

async function fetchCovalentData(userConfig: UserConfig, covaClient: Client): Promise<CovalentBatchResponseData> {
    const [userChains, resolvedAddress] = await getUserChains(userConfig, covaClient);
    const chainList: Chains[] = Array.from(userChains.keys());

    const balancesRes: Map<Chains, BalanceItem[]> = new Map<Chains, BalanceItem[]>();
    const transactionSummaryRes: Map<Chains, TransactionsSummary[]> = new Map<Chains, TransactionsSummary[]>();

    const promises = chainList.map(async (chain) => {
        const [transactionSummaryResp, balancesResp] = await Promise.all([
            covaClient.TransactionService.getTransactionSummary(chain, resolvedAddress),
            covaClient.BalanceService.getTokenBalancesForWalletAddress(chain, resolvedAddress, { quoteCurrency: userConfig.currency })
        ]);

        if(balancesResp.data != null) {
            balancesRes.set(chain, balancesResp.data.items);
        }

        if (transactionSummaryResp.data != null) {
            transactionSummaryRes.set(chain, transactionSummaryResp.data.items);
        }
    });

    await Promise.all(promises);

    const res:CovalentBatchResponseData = {
        userChains: userChains,
        balances: balancesRes,
        address: resolvedAddress,
        transactionSummary: transactionSummaryRes,
    };

    return res;
}

async function fetchCovalentDataAndTxs(userConfig: UserConfig, covaClient: Client): Promise<CovalentBatchResponseDataAndTxs> {
    const [userChains, resolvedAddress] = await getUserChains(userConfig, covaClient);
    const chainList: Chains[] = Array.from(userChains.keys());

    const balancesRes: Map<Chains, BalanceItem[]> = new Map<Chains, BalanceItem[]>();
    const transactionSummaryRes: Map<Chains, TransactionsSummary[]> = new Map<Chains, TransactionsSummary[]>();
    const transactionsRes: Map<Chains, Map<string, number>> = new Map<Chains, Map<string, number>>();

    const promises = chainList.map(async (chain) => {
        const transactionSummaryPromise = covaClient.TransactionService.getTransactionSummary(chain, resolvedAddress);
        const balancesPromise = covaClient.BalanceService.getTokenBalancesForWalletAddress(chain, resolvedAddress, { quoteCurrency: userConfig.currency });
        const transactionsPromise = (async () => {
            const transactions: Map<string, number> = new Map<string, number>();
            for await (const tx of covaClient.TransactionService.getAllTransactionsForAddress(chain, resolvedAddress)) {
                const date = new Date(tx.block_signed_at);
                const dateString = date.toISOString().split('T')[0]; // convert to 'YYYY-MM-DD'
                const count = transactions.get(dateString) || 0;
                transactions.set(dateString, count + 1);
            }
            return transactions;
        })();

        return Promise.all([transactionSummaryPromise, balancesPromise, transactionsPromise]).then(([transactionSummaryResp, balancesResp, transactions]) => {
            if(balancesResp.data != null) {
                balancesRes.set(chain, balancesResp.data.items);
            }

            if (transactionSummaryResp.data != null) {
                transactionSummaryRes.set(chain, transactionSummaryResp.data.items);
            }

            transactionsRes.set(chain, transactions);
        });
    });

    await Promise.all(promises);

    const res: CovalentBatchResponseDataAndTxs = {
        userChains: userChains,
        balances: balancesRes,
        address: resolvedAddress,
        transactionSummary: transactionSummaryRes,
        transactions: transactionsRes
    };

    return res;
}
  
function findChainByChainName(chainName: string, chainItems: ChainItem[]): ChainItem {
  const foundChain: ChainItem | undefined = chainItems.find(chain => chain.name === chainName);
  return foundChain ? foundChain : chainItems[0];
}

function findTopTokens(balances: Map<Chains, BalanceItem[]>, numTokens: number): BalanceItemWithChain[] {
    const topTokens: BalanceItemWithChain[] = [];
    for (let [chain, chainBalances] of balances) {
        for (let balance of chainBalances) {
            if (topTokens.length < numTokens) {
                topTokens.push({...balance, chain: chain});
                topTokens.sort(sortBalanceItems);
            } else if (balance.quote > topTokens[topTokens.length - 1].quote) {
                topTokens.pop();
                topTokens.push({...balance, chain: chain});
                topTokens.sort(sortBalanceItems);
            }
        }
    }

    return topTokens;
}

function sortBalanceItems(a:BalanceItem, b:BalanceItem) {
    if (a.quote > b.quote) return -1;
    if (a.quote < b.quote) return 1;
    return 0;
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

const LineBreak = ({userConfig, length}: {userConfig: UserConfig, length: number}) => {
    return (
        <g>
            <line x1="0" y1="0" x2={length} y2="0" stroke={userConfig.fillColor} strokeWidth="1" />
        </g>
    );
}

const HeatMap = ({userConfig, covalentData}: {userConfig: UserConfig, covalentData: CovalentBatchResponseDataAndTxs}) => {
    const daysInYear = 224;
    const weeksInYear = 52;
    const daysInWeek = 7;
    const cellSize = 12; // adjust as needed
    const minOpacity = 0.19; // minimum opacity for cells with transactions
    const cells: JSX.Element[] = [];

    // Calculate the maximum number of transactions in a day
    let maxTransactions = 0;
    for (let day = 0; day < daysInYear; day++) {
        let totalTransactions = 0;
        for (let [chain, transactions] of covalentData.transactions) {
            const date = new Date();
            date.setFullYear(new Date().getFullYear(), 0, day + 1); // set date to the current day of the year
            const dateString = date.toISOString().split('T')[0]; // convert to 'YYYY-MM-DD'
            totalTransactions += transactions.get(dateString) || 0;
        }
        maxTransactions = Math.max(maxTransactions, totalTransactions);
    }

    // Create the heatmap cells
    for (let day = 0; day < daysInYear; day++) {
        const week = Math.floor(day / daysInWeek);
        const dayOfWeek = day % daysInWeek;

        let totalTransactions = 0;
        for (let [chain, transactions] of covalentData.transactions) {
            const date = new Date();
            date.setFullYear(new Date().getFullYear(), 0, day + 1); // set date to the current day of the year
            const dateString = date.toISOString().split('T')[0]; // convert to 'YYYY-MM-DD'
            totalTransactions += transactions.get(dateString) || 0;
        }

        const opacity = totalTransactions > 0 ? Math.max(minOpacity, totalTransactions / maxTransactions) : 0;

        cells.push(
            <Translate key={"translate-"+day} x={week * cellSize } y={dayOfWeek * cellSize }>
                <HeatMapCell key={"heatmapcell-"+day} userConfig={userConfig} covalentData={covalentData} x={0} y={0} width={cellSize} height={cellSize} opacity={opacity} />
            </Translate>
        );
    }

    return (
        <g>
            {cells}
        </g>
    );
};

const HeatMapCell = ({userConfig, covalentData, x, y, width, height, opacity}: {userConfig: UserConfig, covalentData: CovalentBatchResponseDataAndTxs, x: number, y: number, width: number, height: number, opacity: number}) => {
    let rgbaConfig: string = ''
    if (opacity ===0) {
        rgbaConfig = '22,27,34';
        opacity = 1;
    } else {
        rgbaConfig = '0,255,0';
    }
    return (
        <rect x={x} y={y} width={width - 2} height={height - 2} rx={2} ry={2} fill={`rgba(${rgbaConfig}, ${opacity})`} />
    );
};

const MultiTokenDisplay = ({userConfig, covalentData}: {userConfig: UserConfig, covalentData: CovalentBatchResponseData}) => {
    const topTokens: BalanceItemWithChain[] = findTopTokens(covalentData.balances, 3);
    return (
        <g dominantBaseline="text-before-edge" textAnchor="start" fill={userConfig.fillColor} fontFamily={userConfig.fontFamily}>
            <Translate x={0} y={0}>
                <TokenDisplay userConfig={userConfig} token={topTokens[0]}/>
            </Translate>

            <Translate x={190} y={0}>
                <g textAnchor='middle'>
                    <TokenDisplay userConfig={userConfig} token={topTokens[1]}/>
                </g>
                
            </Translate>

            <Translate x={380} y={0}>
                <g textAnchor="end">
                    <TokenDisplay userConfig={userConfig} token={topTokens[2]}/>
                </g>
            </Translate>
        </g>
    );
};

const TokenDisplay = ({userConfig, token} : {userConfig: UserConfig, token: BalanceItemWithChain}) => {

    return (
        <g>
            <text>
                {token.contract_name}
            </text>

            <Translate x={0} y={20}>
                <text>
                    {token.contract_ticker_symbol}
                </text>
            </Translate>

            <Translate x={0} y={40}>
                <text>
                    {formatAsCurrency(token.quote, userConfig.currency)}
                </text>
            </Translate>
        </g>
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
    const isNonstandardAddress: boolean = covalentData.address.toLowerCase() != userConfig.address.toLowerCase();
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
            <text fontSize={userConfig.address.length >= 40 ? '13' : '15'} >
                {displayAddress}
            </text>

            {/* <Translate x={5.25} y={18}> */}
            <Translate x={0} y={18}>
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
    const chainCount: number = covalentData.userChains.size;   
    const logoCount: number = logos.size;
    var i: number = 0;

    if (logoCount == 1) {
        for (let [key, value] of logos) {
            const blockScannerLink = generateBlockScannerAddressLink(key, covalentData.address)
            chainLogos.push(
                <Translate key={"translate-"+key} x={20} y={0}>
                    <ChainLogo key={"chainlogo-"+key} img={value} size={35} link={blockScannerLink}/>
                </Translate>
            );
        }
    } else if (logoCount == 2) {
        for (let [key, value] of logos) {
            const col = i % 3;
            const blockScannerLink = generateBlockScannerAddressLink(key, covalentData.address)
            chainLogos.push(
                <Translate key={"translate-"+key} x={col * 30} y={0}>
                    <ChainLogo key={"chainlogo-"+key} img={value} size={25} link={blockScannerLink}/>
                </Translate>
            );
            i++;
        }
    } else {
        for (let [key, value] of logos) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const blockScannerLink = generateBlockScannerAddressLink(key, covalentData.address)
            chainLogos.push(
                <Translate key={"translate-"+key} x={col * 20} y={row * 20}>
                    <ChainLogo key={"chainlogo-"+key} img={value} size={15} link={blockScannerLink}/>
                </Translate>
            );
            i++;
            if (i >= 9) break;
        }
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

function fetchLatestTxDetails(covalentData: CovalentBatchResponseData): [Chains | undefined, string, string] {
    let latestDate: Date | undefined = undefined;
    let chain: Chains | undefined = undefined;
    let txHash: string = '';
    for (let [key, value] of covalentData.transactionSummary) {
        const chainLatestDate: Date = new Date(value[0].latest_transaction.block_signed_at);
        if (latestDate == undefined || chainLatestDate > latestDate) {
            latestDate = chainLatestDate;
            chain = key;
            txHash = value[0].latest_transaction.tx_hash;
        }
    }

    let latestDateStr: string = '';
    if (latestDate != undefined) {
        latestDateStr = latestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    }

    return [chain, latestDateStr, txHash];
}

const ActivitySummary = ({userConfig, covalentData, logos}: CardContentProps) => {
    const txCount: number = calculateTotalTxCount(covalentData);
    const [chain, lastActivityStr, txHash] = fetchLatestTxDetails(covalentData);
    const blockScannerTxLink = generateBlockScannerTxLink(chain, txHash);
    let img: string = '';
    if (chain != undefined && logos.has(chain)){
        img = logos.get(chain) as string;
    }

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
                <Translate x={150} y={-1}>
                    <ChainLogo img={img} size={12} link={blockScannerTxLink}/>
                </Translate>
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
    logos: Map<Chains, string>;
};

const StandardCardContent = ({userConfig, covalentData, logos}: CardContentProps) => {

    return (
        <g dominantBaseline="text-before-edge" textAnchor="start" fill={userConfig.fillColor} fontFamily={userConfig.fontFamily}>
            <Address userConfig={userConfig} covalentData={covalentData} />
            <Translate x={380} y={0}>
                <ChainCounter userConfig={userConfig} covalentData={covalentData} logos={logos}/>
            </Translate>
            <Translate x={0} y={100}>
                <ActivitySummary userConfig={userConfig} covalentData={covalentData} logos={logos}/>
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

function buildDefaultSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseData, logos: Map<Chains, string>): string {
    const height: number = 200;
    const width: number = 450;

    const svg: string = renderToStaticMarkup(
        <SVGWrapper height={height} width={width}>
            <Background />

            <Translate x={36} y={30}>
                <StandardCardContent userConfig={userConfig} covalentData={covalentData} logos={logos}/>
            </Translate>
        </SVGWrapper>
    );

    return svg;
}

function buildTransactionsSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseDataAndTxs, logos: Map<Chains, string>): string {
    const height: number = 300;
    const width: number = 450;

    const svg: string = renderToStaticMarkup(
        <SVGWrapper height={height} width={width}>
            <Background />

            <Translate x={36} y={30}>
                <StandardCardContent userConfig={userConfig} covalentData={covalentData} logos={logos}/>
                <Translate x={0} y={168}>
                    <HeatMap userConfig={userConfig} covalentData={covalentData}/>
                </Translate>
            </Translate>
            <Translate x={30} y={185}>
                <LineBreak userConfig={userConfig} length={390}/>
            </Translate>
            
        </SVGWrapper>
    );

    return svg;
}

function buildTokensSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseData, logos: Map<Chains, string>): string {
    const height: number = 300;
    const width: number = 450;

    const svg: string = renderToStaticMarkup(
        <SVGWrapper height={height} width={width}>
            <Background />

            <Translate x={36} y={30}>
                <StandardCardContent userConfig={userConfig} covalentData={covalentData} logos={logos}/>
                <Translate x={0} y={178}>
                    <MultiTokenDisplay userConfig={userConfig} covalentData={covalentData}/>
                </Translate>
            </Translate>
            <Translate x={30} y={185}>
                <LineBreak userConfig={userConfig} length={390}/>
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

async function fetchChainLogos(covalentData: CovalentBatchResponseData): Promise<Map<Chains, string>> {
    const logos: Map<Chains, string> = new Map<Chains, string>();

    for (let [key, value] of covalentData.userChains) {
        const base64Image = await fetchBase64Image(value.logo_url);
        logos.set(key, base64Image);
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

function generateBlockScannerAddressLink(chainName: string, address: string): string {
    if (blockScannerAddressLinks.has(chainName)) {
        return blockScannerAddressLinks.get(chainName) + address;
    }

    return "";
}

const blockScannerTxLinks: Map<Chains, string> = new Map<Chains, string>([
    ["eth-mainnet", "https://etherscan.io/tx/"],
    ["matic-mainnet", "https://polygonscan.com/tx/"],
    ["bsc-mainnet", "https://bscscan.com/tx/"],
    ["avalanche-mainnet", "https://avascan.info/blockchain/c/tx/"],
    ["fantom-mainnet", "https://ftmscan.com/tx/"],
    ["zora-mainnet", "https://explorer.zora.energy/tx/"],
    ["arbitrum-nova-mainnet", "https://nova.arbiscan.io/tx/"],
    ["arbitrum-mainnet", "https://arbiscan.io/tx/"],
    ["moonbeam-moonriver", "https://moonscan.io/tx/"],
    ["optimism-mainnet", "https://optimistic.etherscan.io/tx/"],
    ["linea-mainnet", "https://lineascan.build/tx/"],
    ["base-mainnet", "https://basescan.org/tx/"],
    ["mantle-mainnet", "https://mantlescan.info/tx/"],
]);

function generateBlockScannerTxLink(chain: Chains | undefined, txHash: string): string {
    if (chain != undefined && blockScannerTxLinks.has(chain)) {
        return blockScannerTxLinks.get(chain) + txHash;
    }

    return "";
}

async function generateDefaultSVG(userConfig: UserConfig): Promise<string> {
    const covalentData: CovalentBatchResponseData = await fetchCovalentData(userConfig, covaClient);
    const logos: Map<Chains, string> = await fetchChainLogos(covalentData);
    return buildDefaultSVG(userConfig, covalentData, logos);
}

async function generateTransactionsSVG(userConfig: UserConfig): Promise<string> {
    const covalentData: CovalentBatchResponseDataAndTxs = await fetchCovalentDataAndTxs(userConfig, covaClient);
    const logos: Map<Chains, string> = await fetchChainLogos(covalentData);
    return buildTransactionsSVG(userConfig, covalentData, logos);
}

async function generateTokensSVG(userConfig: UserConfig): Promise<string> {
    const covalentData: CovalentBatchResponseData = await fetchCovalentData(userConfig, covaClient);
    const logos: Map<Chains, string> = await fetchChainLogos(covalentData);
    return buildTokensSVG(userConfig, covalentData, logos);
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<string>
  ) {
      const userConfig: UserConfig = new UserConfig(req);
      let svg: string = '';
      

      switch (userConfig.style) {
        case 'standard' as CardStyle:
            svg = await generateDefaultSVG(userConfig);
            break;
        case 'tx' as CardStyle:
            svg = await generateTransactionsSVG(userConfig);
            break;
        case 'tokens':
            svg = await generateTokensSVG(userConfig);
            break;
        case 'nft':
            break;
        default:
            svg = await generateDefaultSVG(userConfig);
      }

      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(svg);
  }