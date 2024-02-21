import BigNumber from 'bignumber.js'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

export enum Field {
  FROM = 'FROM',
  TO = 'TO',
}

export interface SwapAmount {
  [Field.FROM]: string
  [Field.TO]: string
}

export interface ParsedSwapAmount {
  [Field.FROM]: BigNumber
  [Field.TO]: BigNumber
}

export interface SwapUserInput {
  fromTokenId: string
  swapAmount: SwapAmount
  toTokenId: string
  updatedField: Field
}

export interface SwapTransaction {
  chainId: number
  buyAmount: string
  sellAmount: string
  buyTokenAddress: string
  sellTokenAddress: string
  // be careful -- price means different things when using sellAmount vs buyAmount
  price: string
  guaranteedPrice: string
  /**
   * In percentage, between 0 and 100
   */
  estimatedPriceImpact: string | null
  gas: string
  estimatedGasUse: string | null | undefined
  to: string
  value: string
  data: string
  from: string
  allowanceTarget: string
}

export interface SwapInfo {
  swapId: string
  userInput: SwapUserInput
  quote: {
    preparedTransactions: SerializableTransactionRequest[]
    receivedAt: number
    price: string
    provider: string
    estimatedPriceImpact: string | null
    allowanceTarget: string
  }
  areSwapTokensShuffled: boolean
}

export interface FetchQuoteResponse {
  unvalidatedSwapTransaction: SwapTransaction
  details: {
    swapProvider: string
  }
}
