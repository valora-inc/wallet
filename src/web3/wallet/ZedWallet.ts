import { ReactNativeCapsuleWallet } from '@usecapsule/react-native-wallet'
import { store } from 'src/redux/store'

export class ZedWallet extends ReactNativeCapsuleWallet {
  async getUserId(): Promise<string> {
    return store.getState().web3.capsuleAccountId as string
  }
}
