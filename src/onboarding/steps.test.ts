import { BIOMETRY_TYPE } from 'react-native-keychain'
import { initializeAccount } from 'src/account/actions'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import {
  navigate,
  navigateClearingStack,
  navigateHome,
  popToScreen,
} from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getOnboardingStepValues, goToNextOnboardingScreen } from 'src/onboarding/steps'
import { store } from 'src/redux/store'
import { mockOnboardingProps } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/redux/store', () => ({ store: { dispatch: jest.fn() } }))

const mockStore = mocked(store)

describe('onboarding steps', () => {
  const newUserFlowWithEverythingEnabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      skipVerification: false,
      supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
      recoveringFromStoreWipe: false,
      showChooseAdventureScreen: false,
    },
    screens: [
      Screens.NameAndPicture,
      Screens.PincodeSet,
      Screens.EnableBiometry,
      Screens.VerificationStartScreen,
    ],
    name: 'newUserFlowWithEverythingEnabled',
  }

  const newUserFlowWithEverythingDisabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      skipVerification: true,
      supportedBiometryType: null,
      recoveringFromStoreWipe: false,
      showChooseAdventureScreen: false,
    },
    screens: [Screens.NameAndPicture, Screens.PincodeSet],
    name: 'newUserFlowWithEverythingDisabled',
  }

  const importWalletFlowEverythingEnabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      recoveringFromStoreWipe: false,
      choseToRestoreAccount: true,
      skipVerification: false,
      supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
      showChooseAdventureScreen: false,
    },
    screens: [
      Screens.NameAndPicture,
      Screens.PincodeSet,
      Screens.EnableBiometry,
      Screens.ImportWallet,
      Screens.VerificationStartScreen,
    ],
    name: 'importWalletFlowEverythingEnabled',
  }

  it.each([
    newUserFlowWithEverythingEnabled,
    newUserFlowWithEverythingDisabled,
    importWalletFlowEverythingEnabled,
  ])(
    'goToNextOnboardingScreen and getOnboardingStepValues work as expected',
    ({ onboardingProps, screens, name }) => {
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
          expect(navigateHome).toHaveBeenCalled()
        } else {
          try {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(navigate).toHaveBeenCalledWith(screens[index + 1])
          } catch {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(navigateClearingStack).toHaveBeenCalledWith(screens[index + 1])
          }
        }
      })
    }
  )

  describe('goToNextOnboardingScreen', () => {
    const onboardingProps = mockOnboardingProps
    beforeEach(() => {
      mockStore.dispatch.mockClear()
    })
    describe('Screens.EnableBiometry', () => {
      it('should navigate to the home screen and initialize account if skipVerification is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.EnableBiometry,
          onboardingProps,
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should navigate to ImportWallet if choseToRestoreAccount is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.EnableBiometry,
          onboardingProps: {
            ...onboardingProps,
            choseToRestoreAccount: true,
          },
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should naigate to VerficationStartScreen if skipVerification is false and choseToRestoreAccount is false', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.EnableBiometry,
          onboardingProps: {
            ...onboardingProps,
            skipVerification: false,
            choseToRestoreAccount: false,
          },
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen)
      })
    })
    describe('Screens.NameAndPicture', () => {
      it('should navigate to ImportWallet if recoveringFromStoreWipe is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.NameAndPicture,
          onboardingProps,
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should navigate to PincodeSet if recoveringFromStoreWipe is false', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.NameAndPicture,
          onboardingProps: {
            ...onboardingProps,
            recoveringFromStoreWipe: false,
          },
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
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
        expect(mockStore.dispatch).not.toHaveBeenCalled()
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
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(popToScreen).toHaveBeenCalledWith(Screens.Welcome)
        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should navigate to the home screen and initialize account if skipVerification is true', () => {
        goToNextOnboardingScreen({ firstScreenInCurrentStep: Screens.PincodeSet, onboardingProps })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should navigate to Screens.ChoseYourAdventure and initialize account if skipVerification is true and showChooseAdventureScreen is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.PincodeSet,
          onboardingProps: { ...onboardingProps, showChooseAdventureScreen: true },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigate).toHaveBeenCalledWith(Screens.ChoseYourAdventure)
      })
      it('should otherwise navigate to VerificationStartScreen clearing the stack', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.PincodeSet,
          onboardingProps: {
            ...onboardingProps,
            skipVerification: false,
            choseToRestoreAccount: false,
          },
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigateClearingStack).toHaveBeenCalledWith(Screens.VerificationStartScreen)
      })
    })
    describe('Screens.ImportWallet', () => {
      it('should navigate to the home screen if skipVerification is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps,
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should navigate to the Screens.ChoseYourAdventure if skipVerification is true and showChooseAdventureScreen is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps: { ...onboardingProps, showChooseAdventureScreen: true },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should also navigate to the home screen if numberAlreadyVerifiedCentrally is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps: {
            ...onboardingProps,
            skipVerification: false,
            numberAlreadyVerifiedCentrally: true,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should otherwise navigate to VerificationStartScreen', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps: {
            ...onboardingProps,
            skipVerification: false,
          },
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen)
      })
    })
    describe('Screens.VerificationStartScreen', () => {
      it('should navigate to the home screen', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.VerificationStartScreen,
          onboardingProps,
        })
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should navigate to the Screens.ChoseYourAdventure if showChooseAdventureScreen is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.VerificationStartScreen,
          onboardingProps: { ...onboardingProps, showChooseAdventureScreen: true },
        })
        expect(navigate).toHaveBeenCalledWith(Screens.ChoseYourAdventure)
      })
    })
  })
})
