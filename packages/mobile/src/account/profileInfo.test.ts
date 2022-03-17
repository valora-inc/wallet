import { normalizeAddressWith0x } from '@celo/utils/lib/address'
import RNFS from 'react-native-fs'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { profileUploaded } from 'src/account/actions'
import {
  checkIfProfileUploaded,
  getOffchainWrapper,
  getProfileInfo,
  giveProfileAccess,
  uploadNameAndPicture,
} from 'src/account/profileInfo'
import { isProfileUploadedSelector, nameSelector, pictureSelector } from 'src/account/selectors'
import { walletToAccountAddressSelector } from 'src/identity/selectors'
import { DEK, retrieveOrGeneratePepper } from 'src/pincode/authentication'
import { getContractKit, getWallet } from 'src/web3/contracts'
import { getAccountAddress, getConnectedUnlockedAccount } from 'src/web3/saga'
import { dataEncryptionKeySelector } from 'src/web3/selectors'
import {
  mockAccount,
  mockAccount2,
  mockDEKAddress,
  mockName,
  mockPrivateDEK,
  mockWallet,
} from 'test/values'

const mockNameWrite = jest.fn()
const mockNameAllowAccess = jest.fn()
const mockNameRead = jest.fn()
jest.mock('@celo/identity/lib/offchain/accessors/name', () => {
  return {
    PrivateNameAccessor: jest.fn().mockImplementation(() => {
      return {
        write: mockNameWrite,
        allowAccess: mockNameAllowAccess,
        readAsResult: jest.fn(),
        read: mockNameRead,
      }
    }),
  }
})

const mockPictureWrite = jest.fn()
const mockPictureAllowAccess = jest.fn()
const mockPictureRead = jest.fn()
jest.mock('@celo/identity/lib/offchain/accessors/pictures', () => {
  return {
    PrivatePictureAccessor: jest.fn().mockImplementation(() => {
      return {
        write: mockPictureWrite,
        allowAccess: mockPictureAllowAccess,
        readAsResult: jest.fn(),
        read: mockPictureRead,
      }
    }),
  }
})

jest.mock('src/account/UploadServiceDataWrapper', () => {
  return jest.fn().mockImplementation(() => {
    return {
      writeDataTo: jest.fn(),
      readDataFromAsResult: jest.fn(),
    }
  })
})

const imageData = 'rawImageData'
jest.mock('react-native-fs', () => {
  return {
    readFile: jest.fn(() => Promise.resolve(imageData)),
    DocumentDirectoryPath: 'document-path',
  }
})

const contractKit = jest.fn(() => ({
  getWallet: jest.fn(),
  getAccounts: jest.fn(),
}))
const pictureUri = `file://${RNFS.DocumentDirectoryPath}/profile-now.jpg`

describe(uploadNameAndPicture, () => {
  it('uploads name and picture succesfully', async () => {
    const { returnValue } = await expectSaga(uploadNameAndPicture)
      .provide([
        [call(getOffchainWrapper, true), null],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(nameSelector), mockName],
        [select(pictureSelector), pictureUri],
        [call(getContractKit), contractKit],
      ])
      .run()

    expect(returnValue).toEqual(true)
    expect(mockNameWrite).toBeCalledWith({ name: mockName }, [])
    expect(mockPictureWrite).toBeCalledWith(Buffer.from(`data:image/jpeg;base64,${imageData}`), [])
  })

  it('handles error when name fails to upload', async () => {
    mockNameWrite.mockReturnValueOnce(Error('error'))
    const { returnValue } = await expectSaga(uploadNameAndPicture)
      .provide([
        [call(getOffchainWrapper, true), null],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(nameSelector), mockName],
        [select(pictureSelector), pictureUri],
        [call(getContractKit), contractKit],
      ])
      .run()
    expect(returnValue).toEqual(false)
  })

  it('handles error when picture fails to upload', async () => {
    mockPictureWrite.mockReturnValueOnce(Error('error'))
    const { returnValue } = await expectSaga(uploadNameAndPicture)
      .provide([
        [call(getOffchainWrapper, true), null],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(nameSelector), mockName],
        [select(pictureSelector), pictureUri],
        [call(getContractKit), contractKit],
      ])
      .run()
    expect(returnValue).toEqual(false)
  })
})

describe(giveProfileAccess, () => {
  const walletAddress = mockAccount2
  const accountAddress = '0xTEST'
  const walletToAccountAddress = { [normalizeAddressWith0x(walletAddress)]: accountAddress }

  it('gives profile access successfully', async () => {
    await expectSaga(giveProfileAccess, walletAddress)
      .provide([
        [select(walletToAccountAddressSelector), walletToAccountAddress],
        [call(getOffchainWrapper), null],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(nameSelector), mockName],
        [select(pictureSelector), pictureUri],
        [call(getContractKit), contractKit],
      ])
      .run()

    expect(mockNameAllowAccess).toBeCalledWith([accountAddress])
    expect(mockPictureAllowAccess).toBeCalledWith([accountAddress])
  })

  it('handles error when fails to give recipient access to name', async () => {
    mockNameAllowAccess.mockReturnValueOnce(Error('error'))
    await expectSaga(giveProfileAccess, walletAddress)
      .provide([
        [select(walletToAccountAddressSelector), walletToAccountAddress],
        [call(getOffchainWrapper), null],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(nameSelector), mockName],
        [select(pictureSelector), pictureUri],
        [call(getContractKit), contractKit],
      ])
      .run()
  })

  it('handles error when fails to give recipient access to picture', async () => {
    mockPictureAllowAccess.mockReturnValueOnce(Error('error'))
    await expectSaga(giveProfileAccess, walletAddress)
      .provide([
        [select(walletToAccountAddressSelector), walletToAccountAddress],
        [call(getOffchainWrapper), null],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(nameSelector), mockName],
        [select(pictureSelector), pictureUri],
        [call(getContractKit), contractKit],
      ])
      .run()
  })
})

describe(getProfileInfo, () => {
  const address = mockAccount2
  it('reads profile info successfully', async () => {
    await expectSaga(getProfileInfo, address)
      .provide([
        [call(getOffchainWrapper), null],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(nameSelector), mockName],
        [select(pictureSelector), pictureUri],
        [call(getContractKit), contractKit],
      ])
      .run()

    expect(mockNameRead).toBeCalledWith(address)
    expect(mockPictureRead).toBeCalledWith(address)
  })
})

describe(getOffchainWrapper, () => {
  it('unlocks DEK and creates offchain wrapper', async () => {
    const wallet = mockWallet
    const pepper = 'asdfasdf'
    await expectSaga(getOffchainWrapper)
      .provide([
        [select(dataEncryptionKeySelector), mockPrivateDEK],
        [call(retrieveOrGeneratePepper, DEK), pepper],
        [call(getWallet), wallet],
        [call(getContractKit), contractKit],
        [call(getAccountAddress), mockAccount],
      ])
      .run()

    expect(wallet.unlockAccount).toHaveBeenCalledWith(mockDEKAddress, pepper, 0)
  })
})

describe(checkIfProfileUploaded, () => {
  it('uploads name and picture', async () => {
    await expectSaga(checkIfProfileUploaded)
      .provide([
        [select(isProfileUploadedSelector), false],
        [call(uploadNameAndPicture), 'asdf'],
      ])
      .call.fn(uploadNameAndPicture)
      .put(profileUploaded())
      .run()
  })

  it("doesn't upload name and picture if already uploaded", async () => {
    await expectSaga(checkIfProfileUploaded)
      .provide([[select(isProfileUploadedSelector), true]])
      .not.call.fn(uploadNameAndPicture)
      .not.put(profileUploaded())
      .run()
  })
})
