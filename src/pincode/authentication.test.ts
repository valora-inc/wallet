import CryptoJS from 'crypto-js'
import * as Keychain from 'react-native-keychain'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { AuthenticationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { storedPasswordRefreshed } from 'src/identity/actions'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import {
  CANCELLED_PIN_INPUT,
  checkPin,
  DEFAULT_CACHE_ACCOUNT,
  getPasswordSaga,
  getPincode,
  getPincodeWithBiometry,
  passwordHashStorageKey,
  PinBlocklist,
  removeStoredPin,
  retrieveOrGeneratePepper,
  setPincodeWithBiometry,
  updatePin,
} from 'src/pincode/authentication'
import {
  clearPasswordCaches,
  getCachedPepper,
  getCachedPin,
  setCachedPasswordHash,
  setCachedPepper,
  setCachedPin,
} from 'src/pincode/PasswordCache'
import { store } from 'src/redux/store'
import { ensureError } from 'src/utils/ensureError'
import Logger from 'src/utils/Logger'
import { getWalletAsync } from 'src/web3/contracts'
import { getMockStoreData } from 'test/utils'
import { mockAccount } from 'test/values'

jest.mock('src/web3/contracts')
jest.unmock('src/pincode/authentication')
jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
jest.mock('react-native-securerandom', () => ({
  ...(jest.requireActual('react-native-securerandom') as any),
  generateSecureRandom: jest.fn(() => new Uint8Array(16).fill(1)),
}))
jest.mock('src/analytics/ValoraAnalytics')
jest.mock('@celo/utils/lib/async', () => ({
  sleep: jest.fn().mockResolvedValue(true),
}))

const loggerErrorSpy = jest.spyOn(Logger, 'error')
const mockPepper = {
  username: 'some username',
  password: '01010101010101010101010101010101',
  service: 'some service',
  storage: 'some string',
}
const mockPin = '111555'
const mockedKeychain = jest.mocked(Keychain)
const mockStore = jest.mocked(store)
mockStore.getState.mockImplementation(getMockStoreData)
mockStore.dispatch = jest.fn()
const mockedNavigate = navigate as jest.Mock

const expectPincodeEntered = () => {
  expect(navigate).toHaveBeenCalledWith(
    'PincodeEnter',
    expect.objectContaining({
      withVerification: true,
    })
  )
  expect(navigateBack).toHaveBeenCalled()
}

describe(getPasswordSaga, () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedNavigate.mockReset()
  })
  it('Gets password', async () => {
    mockedNavigate.mockImplementationOnce((_, params) => {
      expect(params.withVerification).toBe(true)
      params.onSuccess(mockPin)
    })

    mockedKeychain.getGenericPassword.mockResolvedValue(mockPepper)
    const expectedPassword = mockPepper.password + mockPin

    await expectSaga(getPasswordSaga, mockAccount, true, false)
      .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
      .returns(expectedPassword)
      .run()

    expectPincodeEntered()
  })
  it('should throw an error for unset pincode type', async () => {
    await expect(
      expectSaga(getPasswordSaga, mockAccount, false, false)
        .provide([[select(pincodeTypeSelector), PincodeType.Unset]])
        .run()
    ).rejects.toThrowError('Pin has never been set')
  })
  it('should throw an error for unexpected pincode type', async () => {
    await expect(
      expectSaga(getPasswordSaga, mockAccount, false, false)
        .provide([[select(pincodeTypeSelector), 'unexpectedPinType']])
        .run()
    ).rejects.toThrowError('Unsupported Pincode Type unexpectedPinType')
  })
})

describe(getPincode, () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedNavigate.mockReset()
    clearPasswordCaches()
  })

  it('returns PIN from cache', async () => {
    setCachedPin(DEFAULT_CACHE_ACCOUNT, mockPin)
    const pin = await getPincode()
    expect(pin).toBe(mockPin)
  })
  it('returns pin and stores it in cache', async () => {
    mockedNavigate.mockImplementationOnce((_, params) => {
      expect(params.withVerification).toBe(true)
      params.onSuccess(mockPin)
    })
    const pin = await getPincode()
    expect(pin).toEqual(mockPin)
    expect(navigate).toHaveBeenCalled()
    expect(navigateBack).toHaveBeenCalled()
    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toEqual(pin)
  })
  it('returns pin with biometry if enabled', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ account: { pincodeType: PincodeType.PhoneAuth } })
    )
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: mockPin,
      username: 'username',
      service: 'service',
      storage: 'storage',
    })

    const pin = await getPincode()

    expect(pin).toEqual(mockPin)
    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({
      authenticationPrompt: {
        title: 'unlockWithBiometryPrompt',
      },
      service: 'PIN',
    })
  })
  it('logs an error if biometry fails, and requests pincode input', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ account: { pincodeType: PincodeType.PhoneAuth } })
    )
    mockedKeychain.getGenericPassword.mockRejectedValueOnce('some error')
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onSuccess(mockPin)
    })
    const pin = await getPincode()

    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({
      authenticationPrompt: {
        title: 'unlockWithBiometryPrompt',
      },
      service: 'PIN',
    })
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'storage/keychain',
      'Error retrieving stored item',
      ensureError('some error'),
      true
    )
    expectPincodeEntered()
    expect(pin).toEqual(mockPin)
  })
  it('does not log an error if user cancels biometry, and requests pincode input', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ account: { pincodeType: PincodeType.PhoneAuth } })
    )
    mockedKeychain.getGenericPassword.mockRejectedValueOnce(Error('user canceled the operation'))
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onSuccess(mockPin)
    })
    const pin = await getPincode()

    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({
      authenticationPrompt: {
        title: 'unlockWithBiometryPrompt',
      },
      service: 'PIN',
    })
    expect(loggerErrorSpy).not.toHaveBeenCalled()
    expectPincodeEntered()
    expect(pin).toEqual(mockPin)
  })
  it('throws an error if user cancels the Pin input', async () => {
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onCancel()
    })

    await expect(getPincode()).rejects.toEqual(CANCELLED_PIN_INPUT)
    expect(navigate).toHaveBeenCalled()
    expect(navigateBack).not.toHaveBeenCalled()
    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toBeNull()
  })
})

describe(getPincodeWithBiometry, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns the correct pin and populates the cache', async () => {
    clearPasswordCaches()
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: mockPin,
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const retrievedPin = await getPincodeWithBiometry()

    expect(retrievedPin).toEqual(mockPin)
    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toEqual(mockPin)

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_biometry_start
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_biometry_complete
    )
  })

  it('throws an error if a null pin was retrieved', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false)

    await expect(getPincodeWithBiometry()).rejects.toThrowError(
      'Failed to retrieve pin with biometry, recieved null value'
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_biometry_start
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_biometry_error
    )
  })
})

describe(setPincodeWithBiometry, () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearPasswordCaches()
    mockedNavigate.mockReset()
  })

  it('should set the keychain item with correct options and retrieve the correct pin', async () => {
    setCachedPin(DEFAULT_CACHE_ACCOUNT, mockPin)
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: mockPin,
      username: 'username',
      service: 'PIN',
      storage: 'storage',
    })

    await setPincodeWithBiometry()

    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      'CELO',
      mockPin,
      expect.objectContaining({
        service: 'PIN',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      })
    )
  })
  it('should request the pin if it is not cached, and save the pin', async () => {
    const mockedNavigate = navigate as jest.Mock
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onSuccess(mockPin)
    })
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: mockPin,
      username: 'username',
      service: 'PIN',
      storage: 'storage',
    })

    await setPincodeWithBiometry()

    expectPincodeEntered()
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      'CELO',
      mockPin,
      expect.objectContaining({
        service: 'PIN',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      })
    )
  })
  it('should throw an error if the retrieved pin is incorrect', async () => {
    setCachedPin(DEFAULT_CACHE_ACCOUNT, mockPin)
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some random password',
      username: 'username',
      service: 'PIN',
      storage: 'storage',
    })

    await expect(setPincodeWithBiometry()).rejects.toThrowError(
      "Retrieved value for key 'PIN' does not match stored value"
    )
  })
})

describe(updatePin, () => {
  const oldPin = '123123'
  const oldPassword = mockPepper.password + oldPin
  const newPassword = mockPepper.password + mockPin
  // expectedPasswordHash generated from newPassword
  const newPasswordHash = 'd9bb2d77ec27dc8bf4269a6241daaa0388e8908518458f6ce0314380d11411cd'
  // expectedAccountHash generated from normalizeAddress(mockAccount)
  const accountHash = 'PASSWORD_HASH-0000000000000000000000000000000000007e57'

  beforeEach(() => {
    jest.clearAllMocks()
    clearPasswordCaches()
    mockedKeychain.getGenericPassword.mockImplementation((options) => {
      if (options?.service === 'PEPPER') {
        return Promise.resolve(mockPepper)
      }
      if (options?.service === 'mnemonic') {
        return Promise.resolve({
          username: 'some username',
          password: 'mockEncryptedValue',
          service: 'some service',
          storage: 'some string',
        })
      }
      if (options?.service === accountHash) {
        return Promise.resolve({
          username: 'some username',
          password: newPasswordHash,
          service: 'some service',
          storage: 'some string',
        })
      }
      if (options?.service === 'PIN') {
        return Promise.resolve({
          username: 'some username',
          password: mockPin,
          service: 'some service',
          storage: 'some string',
        })
      }
      return Promise.resolve(false)
    })
    jest.mocked(getWalletAsync).mockResolvedValue({
      updateAccount: jest.fn().mockResolvedValue(true),
    } as any)
  })

  it('should update the cached pin, stored password, and store mnemonic', async () => {
    await updatePin(mockAccount, oldPin, mockPin)

    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toEqual(mockPin)
    expect(mockedKeychain.setGenericPassword).toHaveBeenNthCalledWith(
      1,
      'CELO',
      newPasswordHash,
      expect.objectContaining({ service: accountHash })
    )
    expect(mockedKeychain.setGenericPassword).toHaveBeenNthCalledWith(
      2,
      'CELO',
      'mockEncryptedValue',
      expect.objectContaining({ service: 'mnemonic' })
    )
    // as we are mocking the outcome of encryption/decryption of mnemonic, check
    // that they are called with the expected params
    expect(CryptoJS.AES.decrypt).toHaveBeenCalledWith('mockEncryptedValue', oldPassword)
    expect(CryptoJS.AES.encrypt).toHaveBeenCalledWith('mockDecryptedValue', newPassword)
  })

  it('should update the cached pin, stored password, store mnemonic, and stored pin if biometry is enabled', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ account: { pincodeType: PincodeType.PhoneAuth } })
    )
    await updatePin(mockAccount, oldPin, mockPin)

    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toEqual(mockPin)
    expect(mockedKeychain.setGenericPassword).toHaveBeenNthCalledWith(
      1,
      'CELO',
      newPasswordHash,
      expect.objectContaining({ service: accountHash })
    )
    expect(mockedKeychain.setGenericPassword).toHaveBeenNthCalledWith(
      3,
      'CELO',
      'mockEncryptedValue',
      expect.objectContaining({ service: 'mnemonic' })
    )
    expect(mockedKeychain.setGenericPassword).toHaveBeenNthCalledWith(
      2,
      'CELO',
      mockPin,
      expect.objectContaining({
        service: 'PIN',
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      })
    )
  })
})

describe(removeStoredPin, () => {
  it('should remove the item from keychain', async () => {
    mockedKeychain.resetGenericPassword.mockResolvedValueOnce(true)
    await removeStoredPin()

    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({ service: 'PIN' })
  })
  it('should throw an error if item could not be removed from keychain', async () => {
    mockedKeychain.resetGenericPassword.mockRejectedValueOnce(new Error('some error'))

    await expect(removeStoredPin()).rejects.toThrowError('some error')
  })
})

describe(retrieveOrGeneratePepper, () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearPasswordCaches()
  })

  it('should return the cached pepper', async () => {
    setCachedPepper(DEFAULT_CACHE_ACCOUNT, mockPepper.password)
    const pepper = await retrieveOrGeneratePepper()

    expect(pepper).toEqual(mockPepper.password)
  })

  it('should return the stored pepper if it is not cached', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValueOnce(mockPepper)
    const pepper = await retrieveOrGeneratePepper()

    expect(pepper).toEqual(mockPepper.password)
  })

  it('should store and cache the pepper if it has not been stored or cached', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValueOnce(false)
    mockedKeychain.setGenericPassword.mockResolvedValueOnce({
      service: 'PEPPER',
      storage: 'some storage',
    })
    mockedKeychain.getGenericPassword.mockResolvedValueOnce(mockPepper)
    const pepper = await retrieveOrGeneratePepper()

    expect(pepper).toEqual(mockPepper.password)
    expect(getCachedPepper(DEFAULT_CACHE_ACCOUNT)).toEqual(mockPepper.password)
  })

  it('should throw an error and remove stored pepper if it fails to correctly read the stored pepper', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValueOnce(false)
    mockedKeychain.setGenericPassword.mockResolvedValueOnce({
      service: 'PEPPER',
      storage: 'some storage',
    })
    mockedKeychain.getGenericPassword.mockResolvedValueOnce({
      ...mockPepper,
      password: 'some random password',
    })

    await expect(retrieveOrGeneratePepper()).rejects.toThrowError(
      "Retrieved value for key 'PEPPER' does not match stored value"
    )
    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({ service: 'PEPPER' })
  })
})

describe(PinBlocklist, () => {
  const blocklist = new PinBlocklist()

  describe('#contains', () => {
    const commonPins = [
      '000000',
      '123456',
      '111111',
      '123123',
      '159951',
      '007007',
      '110989',
      '789789',
      '456456',
      '852456',
      '999999',
    ]

    for (const commonPin of commonPins) {
      it(`indicates the list contains common PIN ${commonPin}`, () => {
        expect(blocklist.contains(commonPin)).toBe(true)
      })
    }

    it('indicates inclusion of a small portion of random PINs', () => {
      // Using the frequentist estimator of true probability for a Bernoulli process.
      // https://en.wikipedia.org/wiki/Checking_whether_a_coin_is_fair#Estimator_of_true_probability
      // Using 2000 trials, and a confidence interval Z value of 3.89 gives the test a 1 in 10,000
      // chance of randomly failing. Tolerance is calulated to match these choices using the
      // formulas in the article above.
      const blockProbability = blocklist.size() / 1000000
      const trials = 2000
      const tolerance = 3.89 * Math.sqrt((blockProbability * (1 - blockProbability)) / trials)

      let positives = 0
      for (let i = 0; i < trials; i++) {
        const randomPin = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
        if (blocklist.contains(randomPin)) {
          positives++
        }
      }

      const estimate = positives / trials
      const withinTolerance = Math.abs(blockProbability - estimate) <= tolerance
      expect(withinTolerance).toBe(true)
    })
  })
})

describe(checkPin, () => {
  const expectedPassword = mockPepper.password + mockPin
  const expectedPasswordHash = 'd9bb2d77ec27dc8bf4269a6241daaa0388e8908518458f6ce0314380d11411cd' // sha256 of expectedPassword
  const mockUnlockAccount = jest.fn().mockImplementation((_account, password, _duration) => {
    if (password === expectedPassword) {
      return Promise.resolve(true)
    }
    return Promise.resolve(false)
  })

  beforeEach(() => {
    jest.clearAllMocks()
    clearPasswordCaches()
    setCachedPepper(DEFAULT_CACHE_ACCOUNT, mockPepper.password)
    setCachedPasswordHash(mockAccount, expectedPasswordHash)

    jest.mocked(getWalletAsync).mockResolvedValue({
      unlockAccount: mockUnlockAccount,
    } as any)
  })

  it('returns true if the pin unlocks the account, and refresh the stored password even if a stored password exists', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ identity: { shouldRefreshStoredPasswordHash: true } })
    )

    const result = await checkPin(mockPin, mockAccount)

    expect(result).toBe(true)
    expect(mockUnlockAccount).toHaveBeenCalledWith(mockAccount, expectedPassword, 600)
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      'CELO',
      expectedPasswordHash,
      expect.objectContaining({
        service: passwordHashStorageKey(mockAccount),
      })
    )
    expect(mockStore.dispatch).toHaveBeenCalledWith(storedPasswordRefreshed())
  })

  it('returns true if the pin unlocks the account, and stored the password if it does not exist', async () => {
    setCachedPasswordHash(mockAccount, '') // no cached password hash
    mockedKeychain.getGenericPassword.mockResolvedValueOnce(false) // no stored password hash
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ identity: { shouldRefreshStoredPasswordHash: false } })
    )

    const result = await checkPin(mockPin, mockAccount)

    expect(result).toBe(true)
    expect(mockUnlockAccount).toHaveBeenCalledWith(mockAccount, expectedPassword, 600)
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.setGenericPassword).toHaveBeenCalledWith(
      'CELO',
      expectedPasswordHash,
      expect.objectContaining({
        service: passwordHashStorageKey(mockAccount),
      })
    )
    expect(mockStore.dispatch).toHaveBeenCalledWith(storedPasswordRefreshed())
  })

  it('returns true if the pin matches the stored password, without unlocking the account or updating the keychain', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ identity: { shouldRefreshStoredPasswordHash: false } })
    )

    const result = await checkPin(mockPin, mockAccount)

    expect(result).toBe(true)
    expect(mockUnlockAccount).not.toHaveBeenCalled()
    expect(mockedKeychain.setGenericPassword).not.toHaveBeenCalled()
    expect(mockStore.dispatch).not.toHaveBeenCalled()
  })

  it('returns false if the pin does not match the stored password', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ identity: { shouldRefreshStoredPasswordHash: false } })
    )

    const result = await checkPin('143826', mockAccount) // incorrect pin

    expect(result).toBe(false)
    expect(mockUnlockAccount).not.toHaveBeenCalled()
    expect(mockedKeychain.setGenericPassword).not.toHaveBeenCalled()
    expect(mockStore.dispatch).not.toHaveBeenCalled()
  })

  it('returns false if the pin does not unlock the wallet', async () => {
    const incorrectPin = '143826'
    const incorrectPassword = mockPepper.password + incorrectPin
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ identity: { shouldRefreshStoredPasswordHash: true } })
    )

    const result = await checkPin('143826', mockAccount) // incorrect pin

    expect(result).toBe(false)
    expect(mockUnlockAccount).toHaveBeenCalledWith(mockAccount, incorrectPassword, 600)
    expect(mockedKeychain.setGenericPassword).not.toHaveBeenCalled()
    expect(mockStore.dispatch).not.toHaveBeenCalled()
  })
})
