import { PendingAction } from './reducer'

export enum Actions {
  SHOW_REQUEST_DETAILS = 'WALLETCONNECT/SHOW_REQUEST_DETAILS',
}

export interface ShowRequestDetails {
  type: Actions.SHOW_REQUEST_DETAILS
  request: PendingAction
  infoString: string
}
export const showRequestDetails = (
  request: PendingAction,
  infoString: string
): ShowRequestDetails => ({
  type: Actions.SHOW_REQUEST_DETAILS,
  request,
  infoString,
})
