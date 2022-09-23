export enum Field {
  FROM = 'FROM',
  TO = 'TO',
}

export interface SwapAmount {
  [Field.FROM]: null | string
  [Field.TO]: null | string
}

export interface SwapUserInput {
  toToken: string
  fromToken: string
  swapAmount: SwapAmount
  updatedField: Field
  buyAmount?: string
  sellAmount?: string
}

export interface SwapInfo {
  unvalidatedSwapTransaction: {
    sellToken: string
    buyToken: string
    buyAmount: string
    sellAmount: string
    price: string
    gas: string
    gasPrice: string
  }
}
