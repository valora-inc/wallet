import { RootState } from 'src/redux/reducers'

/**
 * Get the "raw" (non-lower-cased) version of the wallet address in redux state.
 *
 * Intended for the niche data analytics use case of preserving backwards-compatibility with
 *  when we took the wallet address from redux state a different way (not using walletAddressSelector)
 *  for the "accountAddress" user property, which falls back to EOA if no MTW exists.
 *
 * NOTE: modern users (2020 onwards) will *already* have a lower-cased address saved in redux state, so this will
 *  give the same output as walletAddressSelector most of the time.
 */
export const rawWalletAddressSelector = (state: RootState) => state.web3.account ?? null

export const walletAddressSelector = (state: RootState) => state.web3.account?.toLowerCase() ?? null
// @deprecated please use walletAddressSelector instead.
export const currentAccountSelector = walletAddressSelector
export const mtwAddressSelector = (state: RootState) => state.web3.mtwAddress
export const currentAccountInWeb3KeystoreSelector = (state: RootState) =>
  state.web3.accountInWeb3Keystore
export const dataEncryptionKeySelector = (state: RootState) => state.web3.dataEncryptionKey
export const isDekRegisteredSelector = (state: RootState) => state.web3.isDekRegistered
