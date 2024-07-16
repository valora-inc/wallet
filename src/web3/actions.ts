import { Address } from 'viem'

export enum Actions {
  SET_ACCOUNT = 'WEB3/SET_ACCOUNT',
  SET_ACCOUNT_IN_WEB3_KEYSTORE = 'WEB3/SET_ACCOUNT_IN_WEB3_KEYSTORE',
  SET_MTW_ADDRESS = 'WEB3/SET_MTW_ADDRESS',
  SET_DATA_ENCRYPTION_KEY = 'WEB3/SET_DATA_ENCRYPTION_KEY',
  REGISTER_DATA_ENCRYPTION_KEY = 'WEB3/REGISTER_DATA_ENCRYPTION_KEY',
}

export interface SetAccountAction {
  type: Actions.SET_ACCOUNT
  address: Address
}

export interface SetMtwAddressAction {
  type: Actions.SET_MTW_ADDRESS
  address: Address | null
}

export interface SetAccountInWeb3KeystoreAction {
  type: Actions.SET_ACCOUNT_IN_WEB3_KEYSTORE
  address: Address
}

export interface SetDataEncryptionKeyAction {
  type: Actions.SET_DATA_ENCRYPTION_KEY
  key: string
}

export interface RegisterDataEncryptionKeyAction {
  type: Actions.REGISTER_DATA_ENCRYPTION_KEY
}

export type ActionTypes =
  | SetAccountAction
  | SetMtwAddressAction
  | SetAccountInWeb3KeystoreAction
  | SetDataEncryptionKeyAction
  | RegisterDataEncryptionKeyAction

export const setAccount = (address: Address): SetAccountAction => {
  return {
    type: Actions.SET_ACCOUNT,
    address: address.toLowerCase() as Address,
  }
}

export const setMtwAddress = (address: Address | null): SetMtwAddressAction => {
  return {
    type: Actions.SET_MTW_ADDRESS,
    address: (address?.toLowerCase() as Address) ?? address,
  }
}

export const setAccountInWeb3Keystore = (address: Address): SetAccountInWeb3KeystoreAction => {
  return {
    type: Actions.SET_ACCOUNT_IN_WEB3_KEYSTORE,
    address,
  }
}

export const setDataEncryptionKey = (key: string): SetDataEncryptionKeyAction => {
  return {
    type: Actions.SET_DATA_ENCRYPTION_KEY,
    key,
  }
}

export const registerDataEncryptionKey = (): RegisterDataEncryptionKeyAction => {
  return {
    type: Actions.REGISTER_DATA_ENCRYPTION_KEY,
  }
}
