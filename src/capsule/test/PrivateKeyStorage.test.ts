import { v4 as uuidv4 } from 'uuid'
import Logger from '../../utils/Logger'
import { ReactNativePrivateKeyStorage } from '../react-native/ReactNativePrivateKeyStorage'

const privateKeyStoringFlow = async () => {
  const storage = new ReactNativePrivateKeyStorage(uuidv4())
  const key = uuidv4()
  await storage.setPrivateKey(key)
  const obtainedKey = await storage.getPrivateKey()
  if (obtainedKey === key) {
    Logger.debug('privateKeyStoringFlow PASSED')
  } else {
    Logger.debug('privateKeyStoringFlow FAILED')
  }
}

void privateKeyStoringFlow()
