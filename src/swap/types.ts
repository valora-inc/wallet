import BigNumber from 'bignumber.js'

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
  fromToken: string
  swapAmount: SwapAmount
  toToken: string
  updatedField: Field
}

interface Fill {
  adjustedOutput: string
  gas: number
  input: string
  outPut: string
}

interface FillData {
  router: string
  tokenAddress: Array<string>
  makerAmount?: string
  makerToken?: string
  takerAmount?: string
  takerToken?: string
  type?: number
}

interface Order {
  type: number
  source: string
  makerToken: string
  takeToken: string
  makerAmount: string
  takerAmount: string
  fill: Fill
  fillData: FillData
}

interface Source {
  name: string
  proportion: string
}

export interface SwapTransaction {
  allowanceTarget: string
  buyAmount: string
  buyTokenAddress: string
  buyTokenToEthRate: string
  chainId: number
  data: string
  decodedUniqueId: string
  estimatedGas: string
  estimatedPriceImpact: string
  expectedSlippage: string | null
  from: string
  gas: string
  gasPrice: string
  guaranteedPrice: string
  minimumProtocolFee: string
  orders: Array<Order>
  price: string
  protocolFee: string
  sellAmount: string
  sellTokenAddress: string
  sellTokenToEthRate: string
  sources: Array<Source>
  to: string
  value: string
}
export interface ApproveTransaction {
  chainId: number
  data: string
  from: string
  gas: string
  to: string
}

export interface SwapInfo {
  approveTransaction: ApproveTransaction
  unvalidatedSwapTransaction: SwapTransaction
  userInput: SwapUserInput
}

export interface ZeroExResponse {
  approveTransaction: ApproveTransaction
  unvalidatedSwapTransaction: SwapTransaction
}
