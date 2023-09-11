# Shareable Blockchain Wallet Cards
[![CodeFactor](https://www.codefactor.io/repository/github/dylanjrae/wallet-share/badge)](https://www.codefactor.io/repository/github/dylanjrae/wallet-share) [![ViewCount](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2Fdylanjrae%2Fwallet-share&count_bg=%23F01145&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=views&edge_flat=false)](https://hits.seeyoufarm.com) 

Generate a shareable image of your wallet's stats across 160+ chains to share on social media. 

Your customized image is updated in real-time to always reflect new transactions, tokens, and chains.

Get started by generating your own personalized card at [walletshare.dylanrae.ca](https://walletshare.dylanrae.ca).

![sampleCard](https://walletshare.dylanrae.ca/api/v1/img_generator/?address=demo.eth&chain=all-chains&currency=USD&style=standard&fontFamily=monospace)

## Features
- 📝 Easily renders within markdown (e.g. Github, Reddit, etc.)
- 📇 Supports ENS (*demo.eth*), Lens handles (*@lensprotocol*), Unstoppable Domains (*unstoppable.x*), and raw addresses (*0x123...*)
- 📈 Supports 160+ chains, including Ethereum, Polygon, BNB, Base, Avalanche, Fantom, Optimism, Linea, and more!
- 💲 Supports 10+ currencies, including USD, CAD, EUR, and more!
- 🔡 Customizable fonts
- 🌐 Built in links to your wallet details on block explorers for deep dives
- 🏎️ High performance! All cards are generated in 10 seconds or less
- 🔍 Extended cards with granular details coming soon!


## Usage

Head over to [walletshare.dylanrae.ca](https://walletshare.dylanrae.ca) to get your customized card link. Your link should look something like this:

```
https://walletshare.dylanrae.ca/api/v1/img_generator/?address=demo.eth
```

If you want to display on a markdown file, you can use the following syntax:

```
![Wallet Card](https://walletshare.dylanrae.ca/api/v1/img_generator/?address=demo.eth)
```

## Endpoint
The endpoint for generating cards is:
<https://walletshare.dylanrae.ca/api/v1/img_generator/>

### Options

There are a number of options you can use to customize your card.

#### Card Styles
Currently only one card style is supported, but more are coming soon! Stay tuned for a token, NFT, and granular transaction card.

#### Addresses
The card generator supports different address types including ENS, Lens handles, Unstoppable Domains, and raw addresses.

##### ENS Wallets
```
https://walletshare.dylanrae.ca/api/v1/img_generator/?address=demo.eth
```
![ENS Card](https://walletshare.dylanrae.ca/api/v1/img_generator/?address=demo.eth)

##### Lens Wallets
Remember to URL encode your Lens handle! (e.g. `@lenster` -> `%40lenster`)
```
https://walletshare.dylanrae.ca/api/v1/img_generator/?address=%40lenster
```
![Lens Card](https://walletshare.dylanrae.ca/api/v1/img_generator/?address=%40lenster)

##### Unstoppable Domains Wallets
```
https://walletshare.dylanrae.ca/api/v1/img_generator/?address=unstoppable.x
```
![Unstoppable Domains Card](https://walletshare.dylanrae.ca/api/v1/img_generator/?address=unstoppable.x)

##### Raw Addresses
```
https://walletshare.dylanrae.ca/api/v1/img_generator/?address=0xD417144312DbF50465b1C641d016962017Ef6240
```
![Raw Address Card](https://walletshare.dylanrae.ca/api/v1/img_generator/?address=0xD417144312DbF50465b1C641d016962017Ef6240)


##### Chains
The chains displayed on your card can be specified by using the query parameter `chain`. The is `all-chains`, but you can use any chain supported by [Covalent](https://www.covalenthq.com/docs/networks/) using the Chain Name to display the details for a single chain. Here is an example:    
```
https://walletshare.dylanrae.ca/api/v1/img_generator/?address=0x20fe51a9229eef2cf8ad9e89d91cab9312cf3b7a&chain=base-mainnet
```
![Single Chain Card](https://walletshare.dylanrae.ca/api/v1/img_generator/?address=0x20fe51a9229eef2cf8ad9e89d91cab9312cf3b7a&chain=base-mainnet)


#### Fonts
Font can be specified by using the query parameter `fontFamily`. The default font is `monospace`, but you can use any font supported by Google Fonts.

#### Currency
The curreny used by your card can be specified by using the query parameter `currency`. The default currency is `USD`, but you can use any currency supported by [CoinGecko](https://www.coingecko.com/en/api#explore-api).

## Contributing
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

First, run the development server:

```bash
npm run dev
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the front-end.

Feel free to open issue for any bugs or to open a PR for any features you'd like to see!
