export interface Token {
  symbol: string
  address: string // Mento expects address to be in checksum format, or else it won't find the trading pair
  decimals: number
}
