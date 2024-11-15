import { BIOMETRY_TYPE } from 'react-native-keychain'
import { initializeAccount } from 'src/account/actions'
import { navigate, navigateClearingStack, popToScreen } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { updateStatsigAndNavigate } from 'src/onboarding/actions'
import {
  firstOnboardingScreen,
  getOnboardingStepValues,
  goToNextOnboardingScreen,
} from 'src/onboarding/steps'
import { store } from 'src/redux/store'
import { mockOnboardingProps } from 'test/values'
import { onboardingCompleted, updateLastOnboardingScreen } from 'src/onboarding/actions'

jest.mock('src/redux/store', () => ({ store: { dispatch: jest.fn() } }))
jest.mock('src/config', () => ({
  ...jest.requireActual('src/config'),
  ONBOARDING_FEATURES_ENABLED: { CloudBackup: false },
}))

const mockStore = jest.mocked(store)

describe('onboarding steps', () => {
  const newUserFlowWithEverythingEnabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      skipVerification: false,
      supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
      recoveringFromStoreWipe: false,
    },
    screens: [
      Screens.PincodeSet,
      Screens.EnableBiometry,
      Screens.ProtectWallet,
      Screens.VerificationStartScreen,
    ],
    name: 'newUserFlowWithEverythingEnabled',
    finalScreen: Screens.ChooseYourAdventure,
  }

  const newUserFlowWithEverythingDisabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      skipVerification: true,
      supportedBiometryType: null,
      recoveringFromStoreWipe: false,
    },
    screens: [Screens.PincodeSet, Screens.ProtectWallet],
    name: 'newUserFlowWithEverythingDisabled',
    finalScreen: Screens.ChooseYourAdventure,
  }

  const importWalletFlowEverythingEnabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      recoveringFromStoreWipe: false,
      choseToRestoreAccount: true,
      skipVerification: false,
      supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
    },
    screens: [
      Screens.PincodeSet,
      Screens.EnableBiometry,
      Screens.ImportWallet,
      Screens.VerificationStartScreen,
    ],
    name: 'importWalletFlowEverythingEnabled',
    finalScreen: Screens.ChooseYourAdventure,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    newUserFlowWithEverythingEnabled,
    newUserFlowWithEverythingDisabled,
    importWalletFlowEverythingEnabled,
  ])(
    'goToNextOnboardingScreen and getOnboardingStepValues work as expected for $name',
    ({ onboardingProps, screens, name, finalScreen }) => {
      const expectedTotalSteps = screens.length
      screens.forEach((screen, index) => {
        const { totalSteps, step } = getOnboardingStepValues(screen, onboardingProps)
        // Checking that the step number is correct
        try {
          expect(step).toEqual(index + 1)
          expect(totalSteps).toEqual(expectedTotalSteps)
        } catch (error) {
          throw new Error(
            `Expected step ${
              index + 1
            } and totalStep ${expectedTotalSteps} but got ${step} and ${totalSteps} for screen ${screen} in test ${name}`
          )
        }

        goToNextOnboardingScreen({ firstScreenInCurrentStep: screen, onboardingProps })

        // If we are on the last screen, we should navigate home
        // If we are not on the last screen, we should navigate to the next screen via navigate or navigateClearingStack
        if (index === screens.length - 1) {
          // eslint-disable-next-line jest/no-conditional-expect
          expect(mockStore.dispatch).toHaveBeenCalledWith(
            updateStatsigAndNavigate(finalScreen as keyof StackParamList)
          )
          // eslint-disable-next-line jest/no-conditional-expect
          expect(mockStore.dispatch).toHaveBeenCalledWith(onboardingCompleted())
        } else {
          try {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(navigate).toHaveBeenCalledWith(screens[index + 1])
            // eslint-disable-next-line jest/no-conditional-expect
            expect(mockStore.dispatch).toHaveBeenCalledWith(
              updateLastOnboardingScreen(screens[index + 1] as keyof StackParamList)
            )
          } catch {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(navigateClearingStack).toHaveBeenCalledWith(screens[index + 1])
            // eslint-disable-next-line jest/no-conditional-expect
            expect(mockStore.dispatch).toHaveBeenCalledWith(
              updateLastOnboardingScreen(screens[index + 1] as keyof StackParamList)
            )
          }
        }
      })
    }
  )

  describe('firstOnboardingScreen', () => {
    it('should return ImportWallet if recoveringFromStoreWipe is true and onboardingNameScreenEnabled is false', () => {
      const firstScreen = firstOnboardingScreen({
        recoveringFromStoreWipe: true,
      })
      expect(firstScreen).toEqual(Screens.ImportWallet)
    })
    it('should return PincodeSet if recoveringFromStoreWipe is false and onboardingNameScreenEnabled is false', () => {
      const firstScreen = firstOnboardingScreen({
        recoveringFromStoreWipe: false,
      })
      expect(firstScreen).toEqual(Screens.PincodeSet)
    })
  })

  describe('goToNextOnboardingScreen', () => {
    const onboardingProps = mockOnboardingProps
    beforeEach(() => {
      mockStore.dispatch.mockClear()
    })
    describe('Screens.EnableBiometry', () => {
      it('should navigate to ImportWallet if choseToRestoreAccount is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.EnableBiometry,
          onboardingProps: {
            ...onboardingProps,
            choseToRestoreAccount: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ImportWallet)
        )
        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should navigate to ProtectWallet screen if choseToRestoreAccount is false', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.EnableBiometry,
          onboardingProps: {
            ...onboardingProps,
            choseToRestoreAccount: false,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ProtectWallet)
        )
        expect(navigate).toHaveBeenCalledWith(Screens.ProtectWallet)
      })
      it('should navigate to the CYA screen', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.EnableBiometry,
          onboardingProps: {
            ...onboardingProps,
            skipProtectWallet: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ChooseYourAdventure)
        )
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
      })
    })

    describe('Screens.PincodeSet', () => {
      it('should navigate to EnableBiometry if supportedBiometryType is not null', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.PincodeSet,
          onboardingProps: {
            ...onboardingProps,
            supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.EnableBiometry)
        )
        expect(navigate).toHaveBeenCalledWith(Screens.EnableBiometry)
      })
      it('should navigate to ImportWallet and popToScreen if choseToRestoreAccount is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.PincodeSet,
          onboardingProps: {
            ...onboardingProps,
            choseToRestoreAccount: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ImportWallet)
        )
        expect(popToScreen).toHaveBeenCalledWith(Screens.Welcome)

        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should navigate to ProtectWallet', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.PincodeSet,
          onboardingProps,
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ProtectWallet)
        )
        expect(navigate).toHaveBeenCalledWith(Screens.ProtectWallet)
      })
      it('should navigate to the CYA screen', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.PincodeSet,
          onboardingProps: {
            ...onboardingProps,
            skipProtectWallet: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ChooseYourAdventure)
        )
      })
    })
    describe('Screens.ImportWallet', () => {
      it('should navigate to the CYA screen if skipVerification is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps: {
            ...onboardingProps,
            skipVerification: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ChooseYourAdventure)
        )
      })
      it('should also navigate to the CYA screen if numberAlreadyVerifiedCentrally is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps: {
            ...onboardingProps,
            numberAlreadyVerifiedCentrally: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ChooseYourAdventure)
        )
      })
      it('should otherwise navigate to VerificationStartScreen', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps: {
            ...onboardingProps,
          },
        })
        expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen)
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.VerificationStartScreen)
        )
      })
    })
    describe('Screens.ImportSelect', () => {
      it('should navigate to the CYA screen if skipVerification is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportSelect,
          onboardingProps: {
            ...onboardingProps,
            skipVerification: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ChooseYourAdventure)
        )
      })
      it('should also navigate to the CYA screen if numberAlreadyVerifiedCentrally is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportSelect,
          onboardingProps: {
            ...onboardingProps,
            numberAlreadyVerifiedCentrally: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ChooseYourAdventure)
        )
      })
      it('should otherwise navigate to LinkPhoneNumber', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportSelect,
          onboardingProps: {
            ...onboardingProps,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.LinkPhoneNumber)
        )
        expect(navigate).toHaveBeenCalledWith(Screens.LinkPhoneNumber)
      })
    })
    describe('Screens.VerificationStartScreen and Screens.LinkPhoneNumber', () => {
      it.each([Screens.VerificationStartScreen, Screens.LinkPhoneNumber])(
        'From %s should navigate to the Screens.ChooseYourAdventure',
        (screen) => {
          goToNextOnboardingScreen({
            firstScreenInCurrentStep: screen,
            onboardingProps: { ...onboardingProps },
          })
          expect(mockStore.dispatch).toHaveBeenCalledWith(
            updateStatsigAndNavigate(Screens.ChooseYourAdventure)
          )
          expect(mockStore.dispatch).toHaveBeenCalledWith(
            updateLastOnboardingScreen(Screens.ChooseYourAdventure)
          )
        }
      )
    })
    describe('Screens.ProtectWallet', () => {
      it('should navigate to the CYA screen if skipVerification is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ProtectWallet,
          onboardingProps: {
            ...onboardingProps,
            skipVerification: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.ChooseYourAdventure)
        )
      })
      it('should navigate to VerficationStartScreen if skipVerification is false and choseToRestoreAccount is false', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ProtectWallet,
          onboardingProps: {
            ...onboardingProps,
            choseToRestoreAccount: false,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateLastOnboardingScreen(Screens.VerificationStartScreen)
        )
        expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen)
      })
    })
  })
})
