import { UpdateConfigValuesAction } from 'src/app/actions'
import { REHYDRATE, RehydrateAction, getRehydratePayload } from 'src/redux/persist-helper'
import { ActionTypes, Actions } from 'src/web3/actions'

export interface State {
  account: string | null // this is the wallet address (EOA)
  mtwAddress: string | null // this is the account address
  accountInWeb3Keystore: string | null
  // The DEK private key
  dataEncryptionKey: string | null
  // Has the data encryption key been registered in the Accounts contract
  isDekRegistered: boolean | undefined
}

const initialState: State = {
  account: null,
  mtwAddress: null,
  accountInWeb3Keystore: null,
  dataEncryptionKey: null,
  isDekRegistered: false,
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | UpdateConfigValuesAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'web3'),
      }
    }
    case Actions.SET_ACCOUNT:
      return {
        ...state,
        account: action.address.toLowerCase(),
      }
    case Actions.SET_MTW_ADDRESS:
      return {
        ...state,
        mtwAddress: action.address,
      }
    case Actions.SET_ACCOUNT_IN_WEB3_KEYSTORE:
      return {
        ...state,
        accountInWeb3Keystore: action.address,
      }
    case Actions.SET_DATA_ENCRYPTION_KEY:
      return {
        ...state,
        dataEncryptionKey: action.key,
      }
    case Actions.REGISTER_DATA_ENCRYPTION_KEY:
      return {
        ...state,
        isDekRegistered: true,
      }
    default:
      return state
  }
}
