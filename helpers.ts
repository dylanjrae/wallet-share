export const isProduction = process.env.NODE_ENV === 'production'; 
export const API_URL = isProduction ? 'https://wallet-share.dylanrae.ca' : 'http://localhost:3000';  