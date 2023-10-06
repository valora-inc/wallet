import { TokenTransferAction } from 'src/tokens/saga'

export enum Actions {
  TRANSFER = 'STABLE_TOKEN/TRANSFER',
}

export type TransferAction = {
  type: Actions.TRANSFER
} & TokenTransferAction
