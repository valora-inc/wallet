import { BIOMETRY_TYPE } from 'react-native-keychain'
import { initializeAccount } from 'src/account/actions'
import { setHasSeenVerificationNux } from 'src/identity/actions'
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

jest.mock('src/redux/store', () => ({ store: { dispatch: jest.fn() } }))

const mockStore = jest.mocked(store)

describe('onboarding steps', () => {
  const newUserFlowWithEverythingEnabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      skipVerification: false,
      supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
      recoveringFromStoreWipe: false,
      chooseAdventureEnabled: false,
    },
    screens: [
      Screens.NameAndPicture,
      Screens.PincodeSet,
      Screens.EnableBiometry,
      Screens.ProtectWallet,
      Screens.VerificationStartScreen,
    ],
    name: 'newUserFlowWithEverythingEnabled',
    finalScreen: Screens.WalletHome,
  }

  const newUserChooseAdventure = {
    onboardingProps: {
      ...mockOnboardingProps,
      skipVerification: false,
      supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
      recoveringFromStoreWipe: false,
      chooseAdventureEnabled: true,
      onboardingNameScreenEnabled: false,
    },
    screens: [
      Screens.PincodeSet,
      Screens.EnableBiometry,
      Screens.ProtectWallet,
      Screens.VerificationStartScreen,
    ],
    name: 'newUserChooseAdventure',
    finalScreen: Screens.ChooseYourAdventure,
  }

  const newUserFlowWithEverythingDisabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      skipVerification: true,
      supportedBiometryType: null,
      recoveringFromStoreWipe: false,
      chooseAdventureEnabled: false,
    },
    screens: [Screens.NameAndPicture, Screens.PincodeSet, Screens.ProtectWallet],
    name: 'newUserFlowWithEverythingDisabled',
    finalScreen: Screens.WalletHome,
  }

  const importWalletFlowEverythingEnabled = {
    onboardingProps: {
      ...mockOnboardingProps,
      recoveringFromStoreWipe: false,
      choseToRestoreAccount: true,
      skipVerification: false,
      supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
      chooseAdventureEnabled: false,
    },
    screens: [
      Screens.NameAndPicture,
      Screens.PincodeSet,
      Screens.EnableBiometry,
      Screens.ImportWallet,
      Screens.VerificationStartScreen,
    ],
    name: 'importWalletFlowEverythingEnabled',
    finalScreen: Screens.WalletHome,
  }

  it.each([
    newUserFlowWithEverythingEnabled,
    newUserChooseAdventure,
    newUserFlowWithEverythingDisabled,
    importWalletFlowEverythingEnabled,
  ])(
    'goToNextOnboardingScreen and getOnboardingStepValues work as expected',
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

  describe('firstOnboardingScreen', () => {
    it('should return NameAndPicture if onboardingNameScreenEnabled is true', () => {
      const firstScreen = firstOnboardingScreen({
        onboardingNameScreenEnabled: true,
        recoveringFromStoreWipe: false,
      })
      expect(firstScreen).toEqual(Screens.NameAndPicture)
    })
    it('should return ImportWallet if recoveringFromStoreWipe is true and onboardingNameScreenEnabled is false', () => {
      const firstScreen = firstOnboardingScreen({
        onboardingNameScreenEnabled: false,
        recoveringFromStoreWipe: true,
      })
      expect(firstScreen).toEqual(Screens.ImportWallet)
    })
    it('should return PincodeSet if recoveringFromStoreWipe is false and onboardingNameScreenEnabled is false', () => {
      const firstScreen = firstOnboardingScreen({
        onboardingNameScreenEnabled: false,
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
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should navigate to ProtectWallet screen if choseToRestoreAccount is false', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.EnableBiometry,
          onboardingProps: {
            ...onboardingProps,
            skipVerification: false,
            choseToRestoreAccount: false,
          },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(navigate).toHaveBeenCalledWith(Screens.ProtectWallet)
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
      it('should navigate to ProtectWallet', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.PincodeSet,
          onboardingProps,
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(navigate).toHaveBeenCalledWith(Screens.ProtectWallet)
      })
    })
    describe('Screens.ImportWallet', () => {
      it('should navigate to the home screen if skipVerification is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps,
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.WalletHome)
        )
      })
      it('should navigate to the Screens.ChooseYourAdventure if skipVerification is true and chooseAdventureEnabled is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ImportWallet,
          onboardingProps: { ...onboardingProps, chooseAdventureEnabled: true },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
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
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.WalletHome)
        )
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
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.WalletHome)
        )
      })
      it('should navigate to the Screens.ChooseYourAdventure if chooseAdventureEnabled is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.VerificationStartScreen,
          onboardingProps: { ...onboardingProps, chooseAdventureEnabled: true },
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.ChooseYourAdventure)
        )
      })
    })
    describe('Screens.ProtectWallet', () => {
      it('should navigate to the home screen if skipVerification is true', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ProtectWallet,
          onboardingProps,
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(mockStore.dispatch).toHaveBeenCalledWith(
          updateStatsigAndNavigate(Screens.WalletHome)
        )
      })
      it('should navigate to VerficationStartScreen if skipVerification is false and choseToRestoreAccount is false', () => {
        goToNextOnboardingScreen({
          firstScreenInCurrentStep: Screens.ProtectWallet,
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
  })
})
