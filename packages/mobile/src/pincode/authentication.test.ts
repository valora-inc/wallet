import CryptoJS from 'crypto-js'
import * as Keychain from 'react-native-keychain'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import {
  CANCELLED_PIN_INPUT,
  DEFAULT_CACHE_ACCOUNT,
  getPasswordSaga,
  getPincode,
  getPincodeWithBiometry,
  PinBlocklist,
  removeStoredPin,
  setPincodeWithBiometry,
  updatePin,
} from 'src/pincode/authentication'
import { clearPasswordCaches, getCachedPin, setCachedPin } from 'src/pincode/PasswordCache'
import { store } from 'src/redux/store'
import Logger from 'src/utils/Logger'
import { getMockStoreData } from 'test/utils'
import { mockAccount } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.unmock('src/pincode/authentication')
jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
const loggerErrorSpy = jest.spyOn(Logger, 'error')

const mockPepper = {
  username: 'some username',
  password: '0000000000000000000000000000000000000000000000000000000000000001',
  service: 'some service',
  storage: 'some string',
}
const mockPin = '111555'
const mockedKeychain = mocked(Keychain)
const mockStore = mocked(store)
mockStore.getState.mockImplementation(getMockStoreData)
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
    try {
      await expectSaga(getPasswordSaga, mockAccount, false, false)
        .provide([[select(pincodeTypeSelector), PincodeType.Unset]])
        .run()
    } catch (error) {
      expect(error).toEqual(Error('Pin has never been set'))
    }
  })
  it('should throw an error for unexpected pincode type', async () => {
    try {
      await expectSaga(getPasswordSaga, mockAccount, false, false)
        .provide([[select(pincodeTypeSelector), 'unexpectedPinType']])
        .run()
    } catch (error) {
      expect(error).toEqual(Error('Unsupported Pincode Type unexpectedPinType'))
    }
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
    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({ service: 'PIN' })
  })
  it('logs an error if biometry fails, and requests pincode input', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ account: { pincodeType: PincodeType.PhoneAuth } })
    )
    mockedKeychain.getGenericPassword.mockRejectedValueOnce(false)
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onSuccess(mockPin)
    })
    const pin = await getPincode()

    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({ service: 'PIN' })
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'pincode/authentication',
      'Failed to retrieve pin with biometry',
      expect.any(Error)
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
    expect(mockedKeychain.getGenericPassword).toHaveBeenCalledWith({ service: 'PIN' })
    expect(loggerErrorSpy).not.toHaveBeenCalled()
    expectPincodeEntered()
    expect(pin).toEqual(mockPin)
  })
  it('throws an error if user cancels the Pin input', async () => {
    mockedNavigate.mockImplementationOnce((_, params) => {
      params.onCancel()
    })
    expect.assertions(4)
    try {
      await getPincode()
    } catch (error) {
      expect(error).toEqual(CANCELLED_PIN_INPUT)
    }
    expect(navigate).toHaveBeenCalled()
    expect(navigateBack).not.toHaveBeenCalled()
    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toBeNull()
  })
})

describe(getPincodeWithBiometry, () => {
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
  })

  it('throws an error if a null pin was retrieved', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false)

    try {
      await getPincodeWithBiometry()
    } catch (error) {
      expect(error).toEqual(expect.any(Error))
    }
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

    try {
      await setPincodeWithBiometry()
    } catch (error) {
      expect(error).toEqual(expect.any(Error))
    }
  })
})

describe(updatePin, () => {
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
      return Promise.resolve(false)
    })
  })

  const oldPin = '123123'
  const oldPassword = mockPepper.password + oldPin
  const newPassword = mockPepper.password + mockPin
  // expectedPasswordHash generated from mockPin
  const newPasswordHash = '9853810edb88b031bf6ac1505f5689cb423876fbeb14f7a3037c97ec4531b6ae'
  // expectedAccountHash generated from normalizeAddress(mockAccount)
  const accountHash = 'PASSWORD_HASH-0000000000000000000000000000000000007e57'

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
    mockedKeychain.resetGenericPassword.mockResolvedValue(true)
    await removeStoredPin()

    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledTimes(1)
    expect(mockedKeychain.resetGenericPassword).toHaveBeenCalledWith({ service: 'PIN' })
  })
  it('should throw an error if item could not be removed from keychain', async () => {
    mockedKeychain.resetGenericPassword.mockRejectedValue('some error')

    try {
      await removeStoredPin()
    } catch (error) {
      expect(error).toEqual('some error')
    }
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
