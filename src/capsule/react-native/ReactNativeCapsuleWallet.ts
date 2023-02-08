import { store } from 'src/redux/store'
import { CapsuleBaseSigner } from '../CapsuleSigner'
import { CapsuleBaseWallet } from '../CapsuleWallet'
import { SessionStorage } from '../SessionStorage'
import { SignersStorage } from '../SignersStorage'
import { ReactNativeCapsuleSigner } from './ReactNativeCapsuleSigner'
import { ReactNativeSessionStorage } from './ReactNativeSessionStorage'
import { ReactNativeSignersStorage } from './ReactNativeSignersStorage'

export const USER_ID_TAG = '@CAPSULE/USER_ID'

export class ReactNativeCapsuleWallet extends CapsuleBaseWallet {
  getCapsuleSigner(userId: string, ensureSessionActive: () => Promise<void>): CapsuleBaseSigner {
    return new ReactNativeCapsuleSigner(userId, ensureSessionActive)
  }

  getSignersStorage(): SignersStorage {
    return new ReactNativeSignersStorage()
  }

  getChallengeStorage(userId: string): SessionStorage {
    return new ReactNativeSessionStorage(userId)
  }

  async getUserId(): Promise<string> {
    return store.getState().web3.capsuleAccountId as string
  }
}

export { ReactNativeCapsuleWallet as CapsuleWallet }
