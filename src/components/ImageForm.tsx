'use client'

import React, { useState } from 'react';
import { API_URL } from '../../helpers';

const ImageForm: React.FC = () => {
  const [addressInput, setAddressInput] = useState('demo.eth');
  const [chainInput, setChainInput] = useState('eth-mainnet');
  const [currencyInput, setCurrencyInput] = useState('USD');
  const [cardStyle, setCardStyle] = useState('default');
  const [imageUrl, setImageUrl] = useState(`${API_URL}/api/v1/img_generator/?address=${addressInput}&chain=${chainInput}&currency=${currencyInput}&style=${cardStyle}`);
  const [imgLoading, setImgLoading] = useState(false);

  const handleGenerateClick = () => {
    setImgLoading(true);
    const baseUrl = `${API_URL}/api/v1/img_generator/`;
    const queryParams = `?address=${addressInput}&chain=${chainInput}&currency=${currencyInput}&style=${cardStyle}`;
    const generatedUrl = baseUrl + queryParams;
    setImageUrl(generatedUrl);
    // setImgLoading(false);
  };

  const handleUrlClick = () => {
    navigator.clipboard.writeText(imageUrl);  
  };

  return (
    <div className="flex flex-col items-center gap-5 font-mono">

        <input
          className="w-6/12 mt-10 border border-gray-500 text-black text-center rounded"
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
        />
        <select
          value={chainInput}
          onChange={(e) => setChainInput(e.target.value)}
          className=" w-4/12 text-center text-black rounded cursor-pointer"
        >
          <option value="eth-mainnet">Ethereum Mainnet</option>
          <option value="matic-mainnet">Polygon Mainnet</option>
          <option value="avalanche-mainnet">Avalanche C-Chain Mainnet</option>
          <option value="bsc-mainnet">BNB Smart Chain</option>
          <option value="moonbeam-mainnet">Moonbeam Mainnet</option>
          <option value="rsk-mainnet">RSK Mainnet</option>
          <option value="arbitrum-mainnet">Arbitrum Mainnet</option>
          <option value="fantom-mainnet">Fantom Opera</option>
          <option value="palm-mainnet">Palm Mainnet</option>
          <option value="axie-mainnet">Axie Mainnet</option>
          <option value="optimism-mainnet">Synthetix Optimism Mainnet</option>
          <option value="evmos-mainnet">EVMOS Mainnet</option>
          <option value="base-mainnet">Base Mainnet</option>
          <option value="zora-mainnet">Zora Mainnet</option>
        </select>
        <select
          value={currencyInput}
          onChange={(e) => setCurrencyInput(e.target.value)}
          className="w-2/12 text-center text-black rounded cursor-pointer"
        >
          <option value="USD">USD ($)</option>
          <option value="CAD">CAD ($)</option>
          <option value="EUR">EUR (€)</option>
          <option value="INR">INR (₹)</option>
          <option value="JPY">JPY (¥)</option>
          <option value="AUD">AUD ($)</option>
          <option value="GBP">GBP (£)</option>
          <option value="BTC">BTC (Ƀ)</option>
          <option value="ETH">ETH (Ξ)</option>
          <option value="TRY">TRY (₺)</option>
          <option value="RUB">RUB (₽)</option>
        </select>
        <select
          value={cardStyle}
          onChange={(e) => setCardStyle(e.target.value)}
          className="w-2/12 text-center cursor-pointer text-black rounded"
        >
          <option value="default">Default</option>
        </select>

      <button 
        className="border border-2 border-emerald-950 bg-emerald-700 text-xl text-white px-8 py-2 my-6 rounded-md hover:bg-emerald-800"
        onClick={handleGenerateClick}>
          Generate
      </button>
      <p 
        className = "cursor-pointer tracking-widest text-white text-xs border border-gray-500 bg-slate-900 hover:bg-violet-950 px-4 py-2 rounded w-[50rem] ellipses truncate"
        onClick={handleUrlClick}
      >
        {imageUrl}
      </p>
      <object 
        data={imageUrl} 
        type="image/svg+xml"
        onLoad={() => setImgLoading(false)}
        onError={() => setImgLoading(false)}
      />
    </div>
  );
};

export default ImageForm;
