import { BIOMETRY_TYPE } from 'react-native-keychain'
import {
  createAccountSteps,
  registrationStepsSelector,
  restoreAccountSteps,
  storeWipeRecoverySteps,
  verificationPossibleSelector,
} from 'src/app/selectors'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'
import { KomenciAvailable } from 'src/verify/reducer'
import { getMockStoreData, RecursivePartial } from 'test/utils'
import { mockE164Number, mockE164NumberPepper } from 'test/values'

describe(verificationPossibleSelector, () => {
  it('returns true when the number pepper is already cached', () => {
    // cached salt
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balances: { [Currency.Dollar]: '0' } },
          goldToken: { balance: '0' },
          identity: { e164NumberToSalt: { [mockE164Number]: mockE164NumberPepper } },
          verify: { komenci: { errorTimestamps: [] }, status: {} },
        })
      )
    ).toBe(true)
  })
  it('returns true when balance is sufficient and there are no Komenci errors', () => {
    // balance is sufficient
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balances: { [Currency.Dollar]: '0.01' } },
          goldToken: { balance: '0' },
          identity: {
            e164NumberToSalt: {},
          },
          verify: { komenci: { errorTimestamps: [] }, status: {} },
        })
      )
    ).toBe(true)
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balances: { [Currency.Dollar]: '0' } },
          goldToken: { balance: '0.005' },
          identity: { e164NumberToSalt: {} },
          verify: { komenci: { errorTimestamps: [] }, status: {} },
        })
      )
    ).toBe(true)
  })
  it('returns false when balance is not sufficient and there are Komenci errors', () => {
    const now = Date.now()
    // balance is not sufficient
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balances: { [Currency.Dollar]: '0.009' } },
          goldToken: { balance: '0.004' },
          identity: {
            e164NumberToSalt: {},
          },
          verify: {
            komenci: { errorTimestamps: [now, now, now] },
            komenciAvailable: KomenciAvailable.Yes,
            status: {},
          },
        })
      )
    ).toBe(false)
  })

  it('returns true when balance is not sufficient and there are < 2 Komenci errors', () => {
    // balance is not sufficient
    expect(
      verificationPossibleSelector(
        getMockStoreData({
          account: { e164PhoneNumber: mockE164Number },
          stableToken: { balances: { [Currency.Dollar]: '0.009' } },
          goldToken: { balance: '0.004' },
          identity: {
            e164NumberToSalt: {},
          },
          verify: {
            komenci: { errorTimestamps: [0, 0, 0] },
            komenciAvailable: KomenciAvailable.Yes,
            status: {},
          },
        })
      )
    ).toBe(true)
  })
})

describe('registrationStepsSelector', () => {
  const registrationStepsSelectorWithMockStore = (
    screen: Screens,
    storeOverrides: RecursivePartial<RootState> = {}
  ) =>
    registrationStepsSelector(
      getMockStoreData({
        app: {
          activeScreen: screen,
          biometryEnabled: true,
          supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
          ...storeOverrides.app,
        },
        account: {
          choseToRestoreAccount: false,
          recoveringFromStoreWipe: false,
          ...storeOverrides.account,
        },
      })
    )
  it('should return the correct steps for create account screens', () => {
    ;(Object.keys(createAccountSteps) as Array<keyof typeof createAccountSteps>).forEach(
      (screen) => {
        expect(registrationStepsSelectorWithMockStore(screen)).toEqual({
          step: createAccountSteps[screen],
          totalSteps: 4,
        })
      }
    )
  })
  it('should return the correct steps for create account screens with skipValidation enabled', () => {
    ;(Object.keys(createAccountSteps) as Array<keyof typeof createAccountSteps>).forEach(
      (screen) => {
        expect(
          registrationStepsSelectorWithMockStore(screen, {
            app: {
              skipVerification: true,
            },
          })
        ).toEqual({
          step: createAccountSteps[screen],
          totalSteps: 3,
        })
      }
    )
  })
  it('should return the correct steps for restore account screens', () => {
    ;(Object.keys(restoreAccountSteps) as Array<keyof typeof restoreAccountSteps>).forEach(
      (screen) => {
        expect(
          registrationStepsSelectorWithMockStore(screen, {
            account: {
              choseToRestoreAccount: true,
            },
          })
        ).toEqual({ step: restoreAccountSteps[screen], totalSteps: 5 })
      }
    )
  })
  it('should return the correct steps for store wipe recovery screens', () => {
    ;(Object.keys(storeWipeRecoverySteps) as Array<keyof typeof storeWipeRecoverySteps>).forEach(
      (screen) => {
        expect(
          registrationStepsSelectorWithMockStore(screen, {
            account: {
              recoveringFromStoreWipe: true,
            },
          })
        ).toEqual({ step: storeWipeRecoverySteps[screen], totalSteps: 3 })
      }
    )
  })

  it('should return the correct steps for create account screens with biometry disabled', () => {
    const expectedCreateAccountSteps = {
      [Screens.NameAndPicture]: 1,
      [Screens.PincodeSet]: 2,
      [Screens.VerificationEducationScreen]: 3,
      [Screens.VerificationInputScreen]: 3,
    }

    ;(Object.keys(expectedCreateAccountSteps) as Array<
      keyof typeof expectedCreateAccountSteps
    >).forEach((screen) => {
      expect(
        registrationStepsSelectorWithMockStore(screen, {
          app: {
            biometryEnabled: false,
          },
        })
      ).toEqual({
        step: expectedCreateAccountSteps[screen],
        totalSteps: 3,
      })
    })
  })
})
