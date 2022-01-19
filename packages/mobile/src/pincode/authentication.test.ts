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
  getPincodeWithBiometrics,
  PinBlocklist,
  setPincodeWithBiometrics,
} from 'src/pincode/authentication'
import { clearPasswordCaches, getCachedPin, setCachedPin } from 'src/pincode/PasswordCache'
import { store } from 'src/redux/store'
import { getMockStoreData } from 'test/utils'
import { mockAccount } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))

const mockPepper = { password: '0000000000000000000000000000000000000000000000000000000000000001' }
const mockPin = '111555'
const mockedKeychain = mocked(Keychain)
const mockStore = mocked(store)
mockStore.getState.mockImplementation(getMockStoreData)

describe(getPasswordSaga, () => {
  const mockedNavigate = navigate as jest.Mock

  it('Gets password', async () => {
    mockedNavigate.mockImplementationOnce((_, params) => {
      expect(params.withVerification).toBe(true)
      params.onSuccess(mockPin)
    })

    const mockGetGenericPassword = Keychain.getGenericPassword as jest.Mock
    mockGetGenericPassword.mockResolvedValue(mockPepper)
    const expectedPassword = mockPepper.password + mockPin

    await expectSaga(getPasswordSaga, mockAccount, true, false)
      .provide([[select(pincodeTypeSelector), PincodeType.CustomPin]])
      .returns(expectedPassword)
      .run()

    // expect(navigate).toHaveBeenCalled()
    // expect(navigateBack).toHaveBeenCalled()
  })
})

describe(getPincode, () => {
  const mockedNavigate = navigate as jest.Mock

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
  it('returns pin with biometrics if enabled', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({ account: { pincodeType: PincodeType.PhoneAuth } })
    )
    const getPasswordSpy = jest.fn().mockResolvedValue({
      password: mockPin,
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    mockedKeychain.getGenericPassword.mockImplementationOnce(getPasswordSpy)
    await getPincode()

    expect(getPasswordSpy).toHaveBeenCalledTimes(1)
    expect(getPasswordSpy).toHaveBeenCalledWith({ service: 'PIN' })
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

describe(getPincodeWithBiometrics, () => {
  it('returns the correct pin and populates the cache', async () => {
    clearPasswordCaches()
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: mockPin,
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const retrievedPin = await getPincodeWithBiometrics()

    expect(retrievedPin).toEqual(mockPin)
    expect(getCachedPin(DEFAULT_CACHE_ACCOUNT)).toEqual(mockPin)
  })

  it('throws an error if a null pin was retrieved', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false)

    try {
      await getPincodeWithBiometrics()
    } catch (error) {
      expect(error).toEqual(expect.any(Error))
    }
  })
})

describe(setPincodeWithBiometrics, () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setCachedPin(DEFAULT_CACHE_ACCOUNT, mockPin)
  })

  it('should set the keychain item with correct options and retrieve the correct pin', async () => {
    const setPasswordSpy = jest.fn().mockResolvedValue({
      service: 'PIN',
      storage: 'storage',
    })
    mockedKeychain.setGenericPassword.mockImplementationOnce(setPasswordSpy)
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: mockPin,
      username: 'username',
      service: 'PIN',
      storage: 'storage',
    })

    await setPincodeWithBiometrics()

    expect(setPasswordSpy).toHaveBeenCalledTimes(1)
    expect(setPasswordSpy).toHaveBeenCalledWith(
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
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some random password',
      username: 'username',
      service: 'PIN',
      storage: 'storage',
    })

    try {
      await setPincodeWithBiometrics()
    } catch (error) {
      expect(error).toEqual(expect.any(Error))
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
