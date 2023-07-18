'use client'

import React, { useState } from 'react';

const ImageForm: React.FC = () => {
  const [addressInput, setAddressInput] = useState('demo.eth');
  const [chainInput, setChainInput] = useState('eth-mainnet');
  const [currencyInput, setCurrencyInput] = useState('USD');
  const [imageUrl, setImageUrl] = useState(`https://wallet-share.dylanrae.ca/api/v1/img_generator/?address=${addressInput}&chain=${chainInput}&currency=${currencyInput}`);

  const handleGenerateClick = () => {
    const baseUrl = 'https://wallet-share.dylanrae.ca/api/v1/img_generator/';
    const queryParams = `?address=${addressInput}&chain=${chainInput}&currency=${currencyInput}`;
    const generatedUrl = baseUrl + queryParams;
    setImageUrl(generatedUrl);
  };

  return (
    <div>
      <input
        type="text"
        value={addressInput}
        onChange={(e) => setAddressInput(e.target.value)}
      />
      <select
        value={chainInput}
        onChange={(e) => setChainInput(e.target.value)}
      >
        <option value="eth-mainnet">Ethereum Mainnet</option>
        <option value="matic-mainnet">Polygon Mainnet</option>
        <option value="moonbeam-mainnet">Moonbeam Mainnet</option>
      </select>
      <select
        value={currencyInput}
        onChange={(e) => setCurrencyInput(e.target.value)}
      >
        <option value="USD">USD</option>
        <option value="CAD">CAD</option>
        <option value="EUR">EUR</option>
        <option value="INR">INR</option>
      </select>
      <button onClick={handleGenerateClick}>Generate</button>
      <p>{imageUrl}</p>
      <img src={imageUrl} alt="The generated svg displaying a summary for a wallet" />
    </div>
  );
};

export default ImageForm;
