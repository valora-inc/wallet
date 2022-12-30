import { BIOMETRY_TYPE } from 'react-native-keychain'
import {
  createAccountSteps,
  registrationStepsSelector,
  restoreAccountSteps,
  rewardsEnabledSelector,
  storeWipeRecoverySteps,
} from 'src/app/selectors'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getMockStoreData, RecursivePartial } from 'test/utils'

describe('registrationStepsSelector', () => {
  const registrationStepsSelectorWithMockStore = (
    screen: Screens,
    storeOverrides: RecursivePartial<RootState> = {}
  ) =>
    registrationStepsSelector(
      getMockStoreData({
        app: {
          activeScreen: screen,
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
      [Screens.VerificationStartScreen]: 3,
      [Screens.VerificationCodeInputScreen]: 3,
    }

    ;(
      Object.keys(expectedCreateAccountSteps) as Array<keyof typeof expectedCreateAccountSteps>
    ).forEach((screen) => {
      expect(
        registrationStepsSelectorWithMockStore(screen, {
          app: {
            supportedBiometryType: null,
          },
        })
      ).toEqual({
        step: expectedCreateAccountSteps[screen],
        totalSteps: 3,
      })
    })
  })
})

describe(rewardsEnabledSelector, () => {
  const superchargeTokenConfigByToken = { '0xabc': { minBalance: 0, maxBalance: 100 } }
  it('returns true if MTW non-null and supercharge config non-empty', () => {
    expect(
      rewardsEnabledSelector(
        getMockStoreData({
          web3: { mtwAddress: '0x123' },
          app: { superchargeTokenConfigByToken },
        })
      )
    ).toEqual(true)
  })
  it('returns true if wallet address non-null and supercharge config non-empty', () => {
    expect(
      rewardsEnabledSelector(
        getMockStoreData({
          web3: { mtwAddress: null, account: '0x123' },
          app: { superchargeTokenConfigByToken },
        })
      )
    ).toEqual(true)
  })
  it('returns false if supercharge config empty', () => {
    expect(
      rewardsEnabledSelector(
        getMockStoreData({
          web3: { mtwAddress: null, account: '0x123' },
          app: { superchargeTokenConfigByToken: {} },
        })
      )
    ).toEqual(false)
  })
  it('returns false if wallet address and MTW are null', () => {
    expect(
      rewardsEnabledSelector(
        getMockStoreData({
          web3: { mtwAddress: null, account: null },
          app: { superchargeTokenConfigByToken },
        })
      )
    ).toEqual(false)
  })
  // NOTE: the case where MTW is non-null and wallet address is null should not be possible, and it's not clear
  //  whether rewards should be enabled if it did occur (where would we even send the rewards?). so it is intentionally
  //  not covered.
})
