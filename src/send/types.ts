import BigNumber from 'bignumber.js'
import { Recipient } from 'src/recipients/recipient'

export enum InviteRewardsType {
  NFT = 'nft',
  CUSD = 'cUSD',
  NONE = 'none',
}

export interface QrCode {
  type: string
  data: string
}

export interface TransactionDataInput {
  recipient: Recipient & { address: string }
  inputAmount: BigNumber
  amountIsInLocalCurrency: boolean
  tokenAddress?: string
  tokenId: string
  tokenAmount: BigNumber
  comment?: string
}
