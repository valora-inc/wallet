import { Actions as AppActions, VerificationMigrationRanAction } from 'src/app/actions'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { Actions, ActionTypes, Web3SyncProgress } from 'src/web3/actions'

export interface State {
  syncProgress: Web3SyncProgress
  latestBlockNumber: number
  account: string | null // this is the wallet address (EOA)
  mtwAddress: string | null // this is the account address
  accountInWeb3Keystore: string | null
  // The DEK private key
  dataEncryptionKey: string | null
  // Has the data encryption key been registered in the Accounts contract
  isDekRegistered: boolean | undefined
  fornoMode: boolean
  // In case we want to put back the light client in the future
  hadFornoDisabled?: boolean
}

const initialState: State = {
  syncProgress: {
    startingBlock: 0,
    currentBlock: 0,
    highestBlock: 0,
  },
  latestBlockNumber: 0,
  account: null,
  mtwAddress: null,
  accountInWeb3Keystore: null,
  dataEncryptionKey: null,
  isDekRegistered: false,
  fornoMode: true, // networkConfig.initiallyForno,
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction | VerificationMigrationRanAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      // Ignore some persisted properties
      return {
        ...state,
        ...getRehydratePayload(action, 'web3'),
        syncProgress: {
          startingBlock: 0,
          currentBlock: 0,
          highestBlock: 0,
        },
        latestBlockNumber: 0,
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
    // Don't allow changing forno mode
    // case Actions.SET_IS_FORNO:
    //   return {
    //     ...state,
    //     fornoMode: action.fornoMode,
    //   }
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
    case Actions.COMPLETE_WEB3_SYNC:
      return {
        ...state,
        syncProgress: {
          startingBlock: state.syncProgress.startingBlock,
          currentBlock: action.latestBlockNumber,
          highestBlock: action.latestBlockNumber,
        },
        latestBlockNumber: action.latestBlockNumber,
      }
    case Actions.UPDATE_WEB3_SYNC_PROGRESS:
      return {
        ...state,
        syncProgress: action.payload,
      }
    case AppActions.VERIFICATION_MIGRATION_RAN:
      return {
        ...state,
        mtwAddress: action.mtwAddress,
      }
    default:
      return state
  }
}
