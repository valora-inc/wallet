import * as Keychain from 'react-native-keychain'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import {
  CANCELLED_PIN_INPUT,
  DEFAULT_CACHE_ACCOUNT,
  PinBlocklist,
  getPasswordSaga,
  getPincode,
} from 'src/pincode/authentication'
import { clearPasswordCaches, getCachedPin, setCachedPin } from 'src/pincode/PasswordCache'
import { mockAccount } from 'test/values'

const mockPepper = { password: '0000000000000000000000000000000000000000000000000000000000000001' }
const mockPin = '111555'

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
  })

  it('returns PIN from cache', async () => {
    setCachedPin(DEFAULT_CACHE_ACCOUNT, mockPin)
    const pin = await getPincode()
    expect(pin).toBe(mockPin)
  })
  it('returns pin and stores it in cache', async () => {
    clearPasswordCaches()
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
  it('throws an error if user cancels the Pin input', async () => {
    clearPasswordCaches()
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
