import BigNumber from 'bignumber.js'
import { TokenBalance } from 'src/tokens/slice'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

export type SwapType = 'same-chain' | 'cross-chain'

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
  swapType: SwapType
  chainId: number
  buyAmount: string
  sellAmount: string
  buyTokenAddress: string
  sellTokenAddress: string
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
  to: string
  value: string
  data: string
  from: string
  allowanceTarget: string
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
    swapType: SwapType
  }
  areSwapTokensShuffled: boolean
}

export interface FetchQuoteResponse {
  unvalidatedSwapTransaction: SwapTransaction
  details: {
    swapProvider: string
  }
}

export interface SwapFeeAmount {
  amount: BigNumber
  maxAmount?: BigNumber
  token?: TokenBalance
}

export interface AppFeeAmount extends SwapFeeAmount {
  percentage: BigNumber
}
