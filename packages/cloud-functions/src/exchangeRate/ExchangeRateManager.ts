interface LiquidityPoolInfo {
  token0: string
  token1: string
  liquidityToken0: number
  liquidityToken1: number
  rateFrom0To1: number
  rateFrom1To0: number
}

interface LiquidityPoolProvider {
  getInfoFromToken(tokens: string[]): Promise<LiquidityPoolInfo[]>
}

class ExchangeRateManager {
  private sources: LiquidityPoolProvider[] = []

  constructor(sources: LiquidityPoolProvider[]) {
    this.sources = sources
    console.log(this.sources)
  }

  // Fetch Tokens
  // Process Tokens
  // Upload Tokens Prices
}
