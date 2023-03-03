import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'

export const capsuleIdSelector = (state: RootState) =>
  state.web3.capsuleAccountId?.toLowerCase() ?? null

export const capsuleEmailSelector = (state: RootState) =>
  state.web3.capsuleEmail?.toLowerCase() ?? null

export const capsuleAccountSelector = createSelector(
  [capsuleIdSelector, capsuleEmailSelector],
  (id: string | null, email: string | null) => {
    return { id, email }
  }
)

export const walletAddressSelector = (state: RootState) => state.web3.account?.toLowerCase() ?? null
// @deprecated please use walletAddressSelector instead.
export const currentAccountSelector = walletAddressSelector
export const mtwAddressSelector = (state: RootState) => state.web3.mtwAddress
export const currentAccountInWeb3KeystoreSelector = (state: RootState) =>
  state.web3.accountInWeb3Keystore
export const fornoSelector = (state: RootState) => state.web3.fornoMode
export const dataEncryptionKeySelector = (state: RootState) => state.web3.dataEncryptionKey
export const isDekRegisteredSelector = (state: RootState) => state.web3.isDekRegistered
export const accountAddressSelector = (state: RootState) =>
  state.web3.mtwAddress ?? state.web3.account
