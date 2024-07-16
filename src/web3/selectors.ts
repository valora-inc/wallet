import { RootState } from 'src/redux/reducers'

export const walletAddressSelector = (state: RootState) => state.web3.account ?? null
// @deprecated please use walletAddressSelector instead.
export const currentAccountSelector = walletAddressSelector
export const mtwAddressSelector = (state: RootState) => state.web3.mtwAddress
export const currentAccountInWeb3KeystoreSelector = (state: RootState) =>
  state.web3.accountInWeb3Keystore
export const dataEncryptionKeySelector = (state: RootState) => state.web3.dataEncryptionKey
export const isDekRegisteredSelector = (state: RootState) => state.web3.isDekRegistered
