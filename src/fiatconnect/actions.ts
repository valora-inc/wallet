import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'

export enum Actions {
  START_FC_TRANSFER_OUT = 'FIATCONNECT/START_TRANSFER_OUT',
  FC_TRANSFER_OUT_FAILED = 'FIATCONNECT/FC_TRANSFER_OUT_FAILED',
  FC_TRANSFER_OUT_SUCCESS = 'FIATCONNECT/FC_TRANSFER_OUT_SUCCESS',
}

export interface StartFCTransferOutAction {
  type: Actions.START_FC_TRANSFER_OUT
  fiatConnectQuote: FiatConnectQuote
  quoteId: string
  fiatAccountId: string
}

export interface FCTransferOutFailedAction {
  type: Actions.FC_TRANSFER_OUT_FAILED
  quoteId: string
}

export interface FCTransferOutSuccessAction {
  type: Actions.FC_TRANSFER_OUT_SUCCESS
  quoteId: string
}

export type ActionTypes =
  | StartFCTransferOutAction
  | FCTransferOutFailedAction
  | FCTransferOutSuccessAction

export const startFCTransferOut = (
  fiatConnectQuote: FiatConnectQuote,
  quoteId: string,
  fiatAccountId: string
): StartFCTransferOutAction => ({
  type: Actions.START_FC_TRANSFER_OUT,
  fiatConnectQuote,
  quoteId,
  fiatAccountId,
})

export const FCTransferOutFailed = (quoteId: string): FCTransferOutFailedAction => ({
  type: Actions.FC_TRANSFER_OUT_FAILED,
  quoteId,
})

export const FCTransferOutSuccess = (quoteId: string): FCTransferOutSuccessAction => ({
  type: Actions.FC_TRANSFER_OUT_SUCCESS,
  quoteId,
})
