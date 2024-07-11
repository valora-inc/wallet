import BigNumber from 'bignumber.js'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { Address } from 'viem'

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

interface SwapUserInput {
  fromTokenId: string
  swapAmount: SwapAmount
  toTokenId: string
  updatedField: Field
}

interface BaseSwapTransaction {
  swapType: 'same-chain' | 'cross-chain'
  chainId: number
  buyAmount: string
  sellAmount: string
  buyTokenAddress: Address
  sellTokenAddress: Address
  // be careful -- price means different things when using sellAmount vs buyAmount
  price: string
  guaranteedPrice: string
  appFeePercentageIncludedInPrice: string | undefined
  /**
   * In percentage, between 0 and 100
   */
  estimatedPriceImpact: string | null
  gas: string
  estimatedGasUse: string | null | undefined
  to: Address
  value: string
  data: string
  from: Address
  allowanceTarget: Address
}

interface SameChainSwapTransaction extends BaseSwapTransaction {
  swapType: 'same-chain'
}

interface CrossChainSwapTransaction extends BaseSwapTransaction {
  swapType: 'cross-chain'
  // Swap duration estimation in seconds
  estimatedDuration: number
  maxCrossChainFee: string
  estimatedCrossChainFee: string
}

export type SwapTransaction = SameChainSwapTransaction | CrossChainSwapTransaction

export interface SwapInfo {
  swapId: string
  userInput: SwapUserInput
  quote: {
    preparedTransactions: SerializableTransactionRequest[]
    receivedAt: number
    price: string
    appFeePercentageIncludedInPrice: string | undefined
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
