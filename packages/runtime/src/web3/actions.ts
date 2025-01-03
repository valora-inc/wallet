export enum Actions {
  SET_ACCOUNT = 'WEB3/SET_ACCOUNT',
}

export interface SetAccountAction {
  type: Actions.SET_ACCOUNT
  address: string
}

export type ActionTypes = SetAccountAction

export const setAccount = (address: string): SetAccountAction => {
  return {
    type: Actions.SET_ACCOUNT,
    address: address.toLowerCase(),
  }
}
