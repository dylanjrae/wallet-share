'use client'

import React, { useState } from 'react';

const ImageForm: React.FC = () => {
  const [addressInput, setAddressInput] = useState('demo.eth');
  const [dropdown1, setDropdown1] = useState('eth-mainnet');
  const [dropdown2, setDropdown2] = useState('CAD');
  const [imageUrl, setImageUrl] = useState('https://wallet-share.dylanrae.ca/api/v1/img_generator/?address=demo.eth&chain=eth-mainnet&currency=USD');

  const handleGenerateClick = () => {
    const baseUrl = 'https://wallet-share.dylanrae.ca/api/v1/img_generator/';
    const queryParams = `?address=${addressInput}&chain=${dropdown1}&currency=${dropdown2}`;
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
        value={dropdown1}
        onChange={(e) => setDropdown1(e.target.value)}
      >
        <option value="eth-mainnet">Ethereum Mainnet</option>
        <option value="matic-mainnet">Polygon Mainnet</option>
        <option value="moonbeam-mainnet">Moonbeam Mainnet</option>
      </select>
      <select
        value={dropdown2}
        onChange={(e) => setDropdown2(e.target.value)}
      >
        <option value="USD">USD</option>
        <option value="CAD">CAD</option>
        <option value="EUR">EUR</option>
        <option value="IDR">INR</option>
      </select>
      <button onClick={handleGenerateClick}>Generate</button>
      <p>{imageUrl}</p>
      <img src={imageUrl} alt="The generated svg displaying a summary for a wallet" />
    </div>
  );
};

export default ImageForm;
