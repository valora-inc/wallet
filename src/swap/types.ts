export enum Field {
  FROM = 'FROM',
  TO = 'TO',
}

export interface SwapAmount {
  [Field.FROM]: null | string
  [Field.TO]: null | string
}

export interface SwapUserInput {
  buyAmount?: string
  sellAmount?: string
  toToken: string
  fromToken: string
  swapAmount: SwapAmount
  updatedField: Field
}

export interface SwapInfo {
  unvalidatedSwapTransaction: {
    sellToken: string
    buyTokenAddress: string
    sellTokenAddress: string
    buyAmount: string
    sellAmount: string
    price: string
    gas: string
    gasPrice: string
    guaranteedPrice: string
  }
  userInput: SwapUserInput
  approveTransaction: any
}
