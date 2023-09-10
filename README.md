# Shareable Blockchain Wallet Cards
[![ViewCount](https://hits.dwyl.com/dylanjrae/wallet-share.svg?style=flat-square)](http://hits.dwyl.com/dylanjrae/wallet-share)

Generate a shareable image of your wallet's stats across 160+ chains to share on social media. 

Your customized image is updated in real-time to always reflect new transactions, tokens, and chains.

Get started by generating your own personalized card at [walletshare.dylanrae.ca](https://walletshare.dylanrae.ca).

![sampleCard](https://walletshare.dylanrae.ca/api/v1/img_generator/?address=demo.eth&chain=all-chains&currency=USD&style=default&fontFamily=monospace)

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
The endpoint for this tool is:
[https://walletshare.dylanrae.ca/api/v1/img_generator/] https://walletshare.dylanrae.ca/api/v1/img_generator/

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
