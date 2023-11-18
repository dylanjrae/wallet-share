'use client'

import React, { useState } from 'react';
import { API_URL } from '../../utils/helpers';
import { ChainItem } from '@covalenthq/client-sdk';
import LoadingAnimation from './LoadingAnimation';
import UrlDisplayField from './UrlDisplayField';

interface ImageFormProps {
  rawChains: string;
}

const ImageForm: React.FC<ImageFormProps> = ({ rawChains }) => {
  const [addressInput, setAddressInput] = useState('demo.eth');
  const [chainInput, setChainInput] = useState('all-chains');
  const [currencyInput, setCurrencyInput] = useState('USD');
  const [fontFamilyInput, setFontFamilyInput] = useState('monospace');
  const [cardStyle, setCardStyle] = useState('standard');
  const [imageUrl, setImageUrl] = useState(`${API_URL}/api/v1/img_generator/?address=${addressInput}&chain=${chainInput}&currency=${currencyInput}&style=${cardStyle}&fontFamily=${fontFamilyInput}`);
  const [isLoading, setIsLoading] = useState(true);
  const [objectKey, setObjectKey] = useState(Math.random());

  const handleGenerateClick = () => {
    setIsLoading(true);
    const baseUrl = `${API_URL}/api/v1/img_generator/`;
    const queryParams = `?address=${addressInput}&chain=${chainInput}&currency=${currencyInput}&style=${cardStyle}&fontFamily=${fontFamilyInput}`;
    const generatedUrl = baseUrl + queryParams;
    setImageUrl(generatedUrl);
    setObjectKey(Math.random());
  };

  const handleUrlClick = () => {
    navigator.clipboard.writeText(imageUrl);  
  };

  const chains: ChainItem[] = JSON.parse(rawChains);

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
          <option value="all-chains">All Chains</option>
          {chains.filter(chain => !chain.is_testnet).map((chain) => (
            <option key={chain.chain_id} value={chain.name}>
              {chain.label}
            </option>
          ))}
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
          value={fontFamilyInput}
          onChange={(e) => setFontFamilyInput(e.target.value)}
          className="w-2/12 text-center text-black rounded cursor-pointer"
        >
          <option value="monospace">Monospace</option>
          <option value="cursive">Cursive</option>
          <option value="fantasy">Fantasy</option>
          <option value="Arial">Arial</option>
          <option value="Time New Roman">Time New Roman</option>
          <option value="Garamond">Garamond</option>
   
        </select>
        <select
          value={cardStyle}
          onChange={(e) => setCardStyle(e.target.value)}
          className="w-2/12 text-center cursor-pointer text-black rounded"
        >
          <option value="standard">Standard</option>
          <option value="tokens">Tokens</option>
          <option value="tx">Transactions</option>
        </select>

      <button 
        className="border border-2 border-emerald-950 bg-emerald-700 text-xl text-white px-8 py-2 mb-6 rounded-md hover:bg-emerald-800"
        onClick={handleGenerateClick}>
          Generate
      </button>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {isLoading && <LoadingAnimation />}
        <object
          key={objectKey}
          data={imageUrl}
          type="image/svg+xml"
          onLoad={() => {
            setIsLoading(false);          }}
          style={{ flex: 1 }}        />
      </div>

      {isLoading ? 
        <div className="w-[832px]"></div> 
        : 
        <UrlDisplayField imageUrl={imageUrl} handleUrlClick={handleUrlClick} />
      }

    </div>
  );
};

export default ImageForm;
