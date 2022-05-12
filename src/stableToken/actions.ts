import { TokenTransfer, TokenTransferAction } from 'src/tokens/saga'
import { StableCurrency } from 'src/utils/currencies'

export enum Actions {
  SET_BALANCE = 'STABLE_TOKEN/SET_BALANCE',
  SET_EDUCATION_COMPLETED = 'STABLE_TOKEN/SET_EDUCATION_COMPLETED',
  FETCH_BALANCE = 'STABLE_TOKEN/FETCH_BALANCE',
  TRANSFER = 'STABLE_TOKEN/TRANSFER',
}

export interface SetBalanceAction {
  type: Actions.SET_BALANCE
  balances: { [currency in StableCurrency]: string | null }
}

export interface SetEducationCompletedAction {
  type: Actions.SET_EDUCATION_COMPLETED
  educationCompleted: boolean
}

export interface FetchBalanceAction {
  type: Actions.FETCH_BALANCE
}

export type TransferAction = {
  type: Actions.TRANSFER
} & TokenTransferAction

export type ActionTypes =
  | SetBalanceAction
  | SetEducationCompletedAction
  | FetchBalanceAction
  | TransferAction

export const fetchStableBalances = (): FetchBalanceAction => ({
  type: Actions.FETCH_BALANCE,
})

export const setBalance = (
  balances: { [currency in StableCurrency]: string | null }
): SetBalanceAction => ({
  type: Actions.SET_BALANCE,
  balances,
})

export const transferStableToken = ({
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

export const setEducationCompleted = (): SetEducationCompletedAction => ({
  type: Actions.SET_EDUCATION_COMPLETED,
  educationCompleted: true,
})
