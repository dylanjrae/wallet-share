import React from 'react';
import Image from 'next/image';

interface UrlDisplayFieldProps {
  imageUrl: string;
  handleUrlClick: () => void;
}

const UrlDisplayField: React.FC<UrlDisplayFieldProps> = ({ imageUrl, handleUrlClick }) => {
  return (
    <div className="flex justify-between items-center">
      <p 
        className="cursor-pointer tracking-widest text-white text-xs border border-gray-500 bg-slate-900 hover:bg-violet-950 px-4 py-2 rounded w-[50rem] ellipses truncate"
        onClick={handleUrlClick}
      >
        {imageUrl}
      </p>
      <div onClick={handleUrlClick} className="cursor-pointer ml-2">
        <Image src="/copy_icon.svg" alt="Copy Icon" width={24} height={24} />
      </div>
    </div>
    
  );
}

export default UrlDisplayField;