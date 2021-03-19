import { ensureLeading0x, normalizeAddressWith0x } from '@celo/base'
import { PrivateNameAccessor } from '@celo/identity/lib/offchain/accessors/name'
import { PrivatePictureAccessor } from '@celo/identity/lib/offchain/accessors/pictures'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import { UnlockableWallet } from '@celo/wallet-base'
import RNFS from 'react-native-fs'
import { call, put, select } from 'redux-saga/effects'
import { profileUploaded } from 'src/account/actions'
import { isProfileUploadedSelector, nameSelector, pictureSelector } from 'src/account/selectors'
import UploadServiceDataWrapper from 'src/account/UploadServiceDataWrapper'
import { DEK, retrieveOrGeneratePepper } from 'src/pincode/authentication'
import { extensionToMimeType, getDataURL, saveRecipientPicture } from 'src/utils/image'
import Logger from 'src/utils/Logger'
import { getContractKit, getWallet } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { dataEncryptionKeySelector } from 'src/web3/selectors'

const TAG = 'account/profileInfo'

// ensure that accounts existing before this feature was pushed out have their profiles uploaded
export function* checkIfProfileUploaded() {
  const isAlreadyUploaded = yield select(isProfileUploadedSelector)
  if (isAlreadyUploaded) {
    return
  }
  try {
    // TODO: yield call(addMetadataClaim)
    yield call(uploadNameAndPicture)
    yield put(profileUploaded())
  } catch (e) {
    Logger.error(TAG + '@uploadProfileInfo', 'Error uploading profile', e)
  }
}

// TODO: make metadata claim when registering account info, and use fetched metadata url when reading data
// https://github.com/celo-org/celo-monorepo/issues/6941
// more context here: https://github.com/celo-org/celo-monorepo/pull/6604#discussion_r564585517
// export function* addMetadataClaim() {
//   try {
//     const contractKit = yield call(getContractKit)
//     const account = yield select(currentAccountSelector)
//     const metadata = IdentityMetadataWrapper.fromEmpty(account)
//     yield call(
//       [metadata, 'addClaim'],
//       createStorageClaim(BUCKET_URL),
//       NativeSigner(contractKit.web3.eth.sign, account)
//     )
//     Logger.info(TAG + '@addMetadataClaim' + 'created storage claim on chain')
//     yield call(writeToGCPBucket, metadata.toString(), `${account}/metadata.json`)
//     Logger.info(TAG + '@addMetadataClaim' + 'uploaded metadata.json')
//     const accountsWrapper: AccountsWrapper = yield call([
//       contractKit.contracts,
//       contractKit.contracts.getAccounts,
//     ])
//     const setAccountTx = accountsWrapper.setMetadataURL(`${BUCKET_URL}${account}/metadata.json`)
//     const context = newTransactionContext(TAG, 'Set metadata URL')
//     yield call(sendTransaction, setAccountTx.txo, account, context)
//     Logger.info(TAG + '@addMetadataClaim' + 'set metadata URL')
//   } catch (error) {
//     Logger.error(`${TAG}/addMetadataClaim`, 'Could not add metadata claim', error)
//     throw error
//   }
// }

// requires that the DEK has already been registered on chain
export function* uploadNameAndPicture() {
  yield call(unlockDEK, true)
  const contractKit = yield call(getContractKit)
  const account = yield call(getConnectedUnlockedAccount)
  const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

  const name = yield select(nameSelector)
  const nameAccessor = new PrivateNameAccessor(offchainWrapper)
  let writeError = yield call([nameAccessor, 'write'], { name }, [])
  if (writeError) {
    Logger.error(TAG + '@uploadNameAndPicture', writeError)
    throw Error('Unable to write name')
  }
  Logger.info(TAG + 'uploadNameAndPicture', 'uploaded profile name')

  const pictureUri = yield select(pictureSelector)
  if (pictureUri) {
    const data = yield call(RNFS.readFile, pictureUri, 'base64')
    const mimeType = extensionToMimeType[pictureUri.split('.').slice(-1)] || 'image/jpeg'
    const dataURL = getDataURL(mimeType, data)
    const pictureAccessor = new PrivatePictureAccessor(offchainWrapper)
    writeError = yield call([pictureAccessor, 'write'], dataURL, [])
    if (writeError) {
      Logger.error(TAG + '@uploadNameAndPicture', writeError)
      throw Error('Unable to write picture')
    }
    Logger.info(TAG + 'uploadNameAndPicture', 'uploaded profile picture')
  }
}

// this function gives permission to the recipient to view the user's profile info
export function* giveProfileAccess(recipientAddresses: string[]) {
  // TODO: check if key for recipient already exists, skip if yes
  yield call(unlockDEK)
  const account = yield call(getConnectedUnlockedAccount)
  const contractKit = yield call(getContractKit)
  const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

  const nameAccessor = new PrivateNameAccessor(offchainWrapper)
  let writeError = yield call([nameAccessor, 'allowAccess'], recipientAddresses)
  if (writeError) {
    Logger.error(TAG + '@giveProfileAccess', writeError)
    throw Error(`Unable to give ${recipientAddresses} access to name`)
  }

  const pictureUri = yield select(pictureSelector)
  if (pictureUri) {
    const pictureAccessor = new PrivatePictureAccessor(offchainWrapper)
    writeError = yield call([pictureAccessor, 'allowAccess'], recipientAddresses)
    if (writeError) {
      Logger.error(TAG + '@giveProfileAccess', writeError)
      throw Error(`Unable to give ${recipientAddresses} access to picture`)
    }
  }

  Logger.info(TAG + '@giveProfileAccess', 'uploaded symmetric keys for ' + recipientAddresses)
}

export function* getProfileInfo(address: string) {
  // TODO: check if we already have profile info of address
  const account = yield call(getConnectedUnlockedAccount)
  const contractKit = yield call(getContractKit)
  yield call(unlockDEK)
  const offchainWrapper = new UploadServiceDataWrapper(contractKit, account)

  const nameAccessor = new PrivateNameAccessor(offchainWrapper)
  try {
    const name = yield call([nameAccessor, 'read'], address)

    const pictureAccessor = new PrivatePictureAccessor(offchainWrapper)
    let picturePath
    try {
      const pictureObject = yield call([pictureAccessor, 'read'], address)
      const pictureURL = pictureObject.toString()
      picturePath = yield call(saveRecipientPicture, pictureURL, address)
    } catch (error) {
      Logger.warn(`can't fetch picture for ${address}`, error)
    }
    return { name: name.name, thumbnailPath: picturePath }
  } catch (error) {
    Logger.warn(`can't fetch name for ${address}`, error)
  }
  // not throwing error for failed fetches, as addresses may have not uploaded their info
}

export function* unlockDEK(addAccount = false) {
  const privateDataKey: string | null = yield select(dataEncryptionKeySelector)
  if (!privateDataKey) {
    throw new Error('No data key in store. Should never happen.')
  }
  const dataKeyAddress = normalizeAddressWith0x(
    privateKeyToAddress(ensureLeading0x(privateDataKey))
  )
  const wallet: UnlockableWallet = yield call(getWallet)
  // directly using pepper because we don't want to set a PIN for the DEK
  const pepper = yield call(retrieveOrGeneratePepper, DEK)
  if (addAccount) {
    try {
      yield call([wallet, wallet.addAccount], privateDataKey, pepper)
    } catch (error) {
      Logger.warn('Unable to add DEK to geth wallet', error)
    }
  }
  yield call([wallet, wallet.unlockAccount], dataKeyAddress, pepper, 0)
}
