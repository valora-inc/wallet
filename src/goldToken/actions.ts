import { TokenTransfer, TokenTransferAction } from 'src/tokens/saga'

export enum Actions {
  TRANSFER = 'GOLD/TRANSFER',
}

export type TransferAction = {
  type: Actions.TRANSFER
} & TokenTransferAction

export const transferGoldTokenLegacy = ({
  recipientAddress,
  amount,
  currency,
  comment,
  feeInfo,
  context,
}: TokenTransfer): TransferAction => ({
  type: Actions.TRANSFER,
  recipientAddress,
  amount,
  currency,
  comment,
  feeInfo,
  context,
})
