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
  chainInfos: ChainInfo[];
  chainActivity: ChainActivityEvent[];
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
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
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
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
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
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
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
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: TransactionSummary[] = rawResult.data.items;
  return res;
}

async function fetchChainActivity(userConfig: UserConfig): Promise<ChainActivityEvent[]> {
  const response = await fetch('https://api.covalenthq.com/v1/labs/activity/' + userConfig.address + '/', {
    method: 'GET',
    headers: cov_req_headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Covalent data: ' + response.statusText);
  }

  const rawResult: RawCovalentResponse = await response.json();
  const res: ChainActivityEvent[] = rawResult.data.items;
  return res;
}

async function fetchCovalentData(userConfig: UserConfig): Promise<CovalentBatchResponseData> {
    const [chains, chainActivity, balances, transactionSummary] = await Promise.all([
      fetchChainInfo(),
      fetchChainActivity(userConfig),
      fetchBalances(userConfig),
      fetchTransactionSummary(userConfig),
    ]);

    const res:CovalentBatchResponseData = {
        chainInfos: chains,
        chainActivity: chainActivity,
        balances: balances,
        transactionSummary: transactionSummary,
    };

    return res;
}

function findChainLabelByChainName(chainName: string, chainInfos: ChainInfo[]): string {
  const foundChain = chainInfos.find(chain => chain.name === chainName);
  return foundChain ? foundChain.label : 'Unknown';
}

function buildSVG(userConfig: UserConfig, covalentData: CovalentBatchResponseData): string {
  const address: string = userConfig.address;
  const chainLabel: string = findChainLabelByChainName(userConfig.chain, covalentData.chainInfos);
  const txCount: number = covalentData.transactionSummary != undefined ? covalentData.transactionSummary[0].total_count : 0;
  const chainCount: number = covalentData.chainActivity.length;
  const firstActivityDate: Date | undefined = covalentData.transactionSummary != undefined ? new Date(covalentData.transactionSummary[0].earliest_transaction.block_signed_at) : undefined;
  const firstActivityStr: string = firstActivityDate != undefined ? firstActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const lastActivityDate: Date | undefined = covalentData.transactionSummary != undefined ? new Date(covalentData.transactionSummary[0].latest_transaction.block_signed_at) : undefined;
  const lastActivityStr: string = firstActivityDate != undefined ? lastActivityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  // <path d="M0 139L13.7 154C27.3 169 54.7 199 82 193C109.3 187 136.7 145 163.8 133C191 121 218 139 245.2 146C272.3 153 299.7 149 327 159C354.3 169 381.7 193 409 210C436.3 227 463.7 237 491 240C518.3 243 545.7 239 573 221C600.3 203 627.7 171 654.8 166C682 161 709 183 736.2 177C763.3 171 790.7 137 818 150C845.3 163 872.7 223 886.3 253L900 283L900 0L886.3 0C872.7 0 845.3 0 818 0C790.7 0 763.3 0 736.2 0C709 0 682 0 654.8 0C627.7 0 600.3 0 573 0C545.7 0 518.3 0 491 0C463.7 0 436.3 0 409 0C381.7 0 354.3 0 327 0C299.7 0 272.3 0 245.2 0C218 0 191 0 163.8 0C136.7 0 109.3 0 82 0C54.7 0 27.3 0 13.7 0L0 0Z" fill="#6198ff"></path><path d="M0 289L13.7 296C27.3 303 54.7 317 82 303C109.3 289 136.7 247 163.8 228C191 209 218 213 245.2 220C272.3 227 299.7 237 327 260C354.3 283 381.7 319 409 345C436.3 371 463.7 387 491 385C518.3 383 545.7 363 573 335C600.3 307 627.7 271 654.8 262C682 253 709 271 736.2 267C763.3 263 790.7 237 818 247C845.3 257 872.7 303 886.3 326L900 349L900 281L886.3 251C872.7 221 845.3 161 818 148C790.7 135 763.3 169 736.2 175C709 181 682 159 654.8 164C627.7 169 600.3 201 573 219C545.7 237 518.3 241 491 238C463.7 235 436.3 225 409 208C381.7 191 354.3 167 327 157C299.7 147 272.3 151 245.2 144C218 137 191 119 163.8 131C136.7 143 109.3 185 82 191C54.7 197 27.3 167 13.7 152L0 137Z" fill="#3c80ff"></path><path d="M0 361L13.7 372C27.3 383 54.7 405 82 396C109.3 387 136.7 347 163.8 330C191 313 218 319 245.2 329C272.3 339 299.7 353 327 369C354.3 385 381.7 403 409 418C436.3 433 463.7 445 491 446C518.3 447 545.7 437 573 416C600.3 395 627.7 363 654.8 359C682 355 709 379 736.2 369C763.3 359 790.7 315 818 322C845.3 329 872.7 387 886.3 416L900 445L900 347L886.3 324C872.7 301 845.3 255 818 245C790.7 235 763.3 261 736.2 265C709 269 682 251 654.8 260C627.7 269 600.3 305 573 333C545.7 361 518.3 381 491 383C463.7 385 436.3 369 409 343C381.7 317 354.3 281 327 258C299.7 235 272.3 225 245.2 218C218 211 191 207 163.8 226C136.7 245 109.3 287 82 301C54.7 315 27.3 301 13.7 294L0 287Z" fill="#0066ff"></path><path d="M0 541L13.7 540C27.3 539 54.7 537 82 532C109.3 527 136.7 519 163.8 521C191 523 218 535 245.2 537C272.3 539 299.7 531 327 524C354.3 517 381.7 511 409 515C436.3 519 463.7 533 491 542C518.3 551 545.7 555 573 549C600.3 543 627.7 527 654.8 523C682 519 709 527 736.2 528C763.3 529 790.7 523 818 524C845.3 525 872.7 533 886.3 537L900 541L900 443L886.3 414C872.7 385 845.3 327 818 320C790.7 313 763.3 357 736.2 367C709 377 682 353 654.8 357C627.7 361 600.3 393 573 414C545.7 435 518.3 445 491 444C463.7 443 436.3 431 409 416C381.7 401 354.3 383 327 367C299.7 351 272.3 337 245.2 327C218 317 191 311 163.8 328C136.7 345 109.3 385 82 394C54.7 403 27.3 381 13.7 370L0 359Z" fill="#0059dd"></path><path d="M0 601L13.7 601C27.3 601 54.7 601 82 601C109.3 601 136.7 601 163.8 601C191 601 218 601 245.2 601C272.3 601 299.7 601 327 601C354.3 601 381.7 601 409 601C436.3 601 463.7 601 491 601C518.3 601 545.7 601 573 601C600.3 601 627.7 601 654.8 601C682 601 709 601 736.2 601C763.3 601 790.7 601 818 601C845.3 601 872.7 601 886.3 601L900 601L900 539L886.3 535C872.7 531 845.3 523 818 522C790.7 521 763.3 527 736.2 526C709 525 682 517 654.8 521C627.7 525 600.3 541 573 547C545.7 553 518.3 549 491 540C463.7 531 436.3 517 409 513C381.7 509 354.3 515 327 522C299.7 529 272.3 537 245.2 535C218 533 191 521 163.8 519C136.7 517 109.3 525 82 530C54.7 535 27.3 537 13.7 538L0 539Z" fill="#004cbb"></path>

  const svg: string = `
  <svg id="visual" viewBox="0 0 450 300" width="450" height="300" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
    <rect x="0" y="0" width="100%" height="100%" rx="12" ry="12" fill="0x151515">
      <animate attributeName="fill" values="#808080; #151515; #808080" dur="3s" repeatCount="indefinite" />
    </rect>

    <rect x="1%" y="1%" width="98%" height="98%" rx="10" ry="10" fill="0x151515">
    </rect> 

    <svg x="8%" y="10%">
      <text x="0%" y="0%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="${address.length >= 42 ? '12' : '18'}">
        ${address}
      </text>

      <text x="2%" y="6%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
        hex address here if exists
      </text>

      <text x="70%" y="2%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="16">
        ${chainCount} ${chainCount === 1 ? 'Chain' : 'Chains'}
      </text>

      <svg x="1%" y="18%">
        <text x="0%" y="0%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
          ${txCount} ${txCount === 1 ? 'Transaction' : 'Transactions'}
        </text>

        <text x="0%" y="3.5%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
          Last activity: ${lastActivityStr}
        </text>

        <text x="0%" y="7%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
          First activity: ${firstActivityStr}
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
    res.send(svg);

    // res.status(200).json(covalentData);
}


{/* <text x="9%" y="36%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
      ${txCount} ${txCount === 1 ? 'Transaction' : 'Transactions'}
    </text>

    <text x="9%" y="39%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
      First activity: ${firstActivityStr}
    </text>

    <text x="9%" y="42%" dominant-baseline="text-before-edge" text-anchor="start" fill="white" font-size="10">
      Last activity: ${firstActivityStr}
    </text> */}