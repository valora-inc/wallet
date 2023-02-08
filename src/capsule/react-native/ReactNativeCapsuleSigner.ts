import { PrivateKeyStorage } from '../PrivateKeyStorage'
import { CapsuleBaseSigner } from '../CapsuleSigner'
import { ReactNativePrivateKeyStorage } from './ReactNativePrivateKeyStorage'

export class ReactNativeCapsuleSigner extends CapsuleBaseSigner {
  protected getPrivateKeyStorage(account: string): PrivateKeyStorage {
    return new ReactNativePrivateKeyStorage(account)
  }
}
