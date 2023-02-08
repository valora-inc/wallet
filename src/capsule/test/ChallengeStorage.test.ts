// This is not actually a test in a way that we write, e.g., jest tests.
// We need to have it running inside the mobile app with native module by importing e.g., in App.ts

// @ts-ignore
import userManagementClient from '../UserManagementClient'
import { v4 as uuidv4 } from 'uuid'
import Logger from '../../utils/Logger'
import crypto from 'crypto'
import elliptic from 'elliptic'
import { ReactNativeSessionStorage } from '../react-native/ReactNativeSessionStorage'
const ecl = new elliptic.ec('p256')

const completeFlowWithServer = async () => {
  const { userId } = await userManagementClient.createUser({
    email: `test-${uuidv4()}@test.usecapsule.com`,
  })
  await userManagementClient.verifyEmail(userId, { verificationCode: '123456' })
  const storage = new ReactNativeSessionStorage(userId)

  await userManagementClient.addSessionPublicKey(userId, {
    publicKey: await storage.getPublicKey(),
  })
  const challenge = await userManagementClient.getSessionChallenge(userId)
  const message = challenge.data.challenge
  const signature = await storage.signChallenge(message)

  const res = await userManagementClient.verifySessionChallenge(userId, {
    signature,
  })
  if (res.status === 200) {
    Logger.debug('completeFlowWithServer PASSED')
  } else {
    Logger.debug('completeFlowWithServer FAILED')
  }
}

const completeFlowOffline = async () => {
  const storage = new ReactNativeSessionStorage('123')
  const message = '1d52c368-d91c-46f4-b449-fa142c8b812d'
  void (await storage.getPublicKey()) // we cannot sign without session key initialized.
  const signature = await storage.signChallenge(message)
  const publicKeyHex = await storage.getPublicKey()
  const publicKey = ecl.keyFromPublic(publicKeyHex, 'hex')
  const messageHash = crypto.createHash('sha256')
  messageHash.update(message)
  const hashedMessage = messageHash.digest('hex')
  if (publicKey.verify(hashedMessage, signature)) {
    Logger.debug('completeFlowOffline PASSED')
  } else {
    Logger.debug('completeFlowOffline FAILED')
  }
}

void completeFlowOffline()
void completeFlowWithServer()
