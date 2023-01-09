import { TokenTransfer, TokenTransferAction } from 'src/tokens/saga'

export enum Actions {
  TRANSFER = 'STABLE_TOKEN/TRANSFER',
}

export type TransferAction = {
  type: Actions.TRANSFER
} & TokenTransferAction

export const transferStableTokenLegacy = ({
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
