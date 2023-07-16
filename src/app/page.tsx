import Image from 'next/image'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <textarea className="w-46 h-15">
        TEST
      </textarea>
      
      <select>
        <option value="CAD">CAD</option>
        <option value="CAD">CAD</option>
      
      </select>
      <img src="https://wallet-share.dylanrae.ca/api/v1/img_generator?currency=CAD&address=@lensprotocol&chain=eth-mainnet"></img>
    </main>
  )
}
