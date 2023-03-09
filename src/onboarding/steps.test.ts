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
import {
  END_OF_ONBOARDING_SCREEN,
  FIRST_ONBOARDING_SCREEN,
  getOnboardingStepValues,
  goToNextOnboardingScreen,
  _getScreenInfo,
} from 'src/onboarding/steps'
import { store } from 'src/redux/store'
import { mockOnboardingProps } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/redux/store', () => ({ store: { dispatch: jest.fn() } }))

const mockStore = mocked(store)

describe('onboarding steps', () => {
  describe('_getScreenInfo and getOnboardingStepValues', () => {
    it('All paths from FIRST_ONBOARDING_SCREEN lead to END_OF_ONBOARDING_SCREEN and have incrementing steps', () => {
      const options = {
        recoveringFromStoreWipe: [true, false],
        choseToRestoreAccount: [true, false],
        supportedBiometryType: [null, BIOMETRY_TYPE.FACE_ID],
        skipVerification: [true, false],
        numberAlreadyVerifiedCentrally: [true, false],
      }

      options.recoveringFromStoreWipe.forEach((recoveringFromStoreWipe) => {
        options.choseToRestoreAccount.forEach((choseToRestoreAccount) => {
          options.supportedBiometryType.forEach((supportedBiometryType) => {
            options.skipVerification.forEach((skipVerification) => {
              options.numberAlreadyVerifiedCentrally.forEach((numberAlreadyVerifiedCentrally) => {
                // Initiate Test Variables
                const onboardingProps = {
                  recoveringFromStoreWipe,
                  choseToRestoreAccount,
                  supportedBiometryType,
                  skipVerification,
                  numberAlreadyVerifiedCentrally,
                }
                let currentScreen: Screens = FIRST_ONBOARDING_SCREEN
                let stepCounter = 1

                const navigate = (s: Screens) => {
                  currentScreen = s
                  stepCounter++
                }
                const navigateHome = () => {
                  currentScreen = END_OF_ONBOARDING_SCREEN
                }

                const { totalSteps } = getOnboardingStepValues(
                  FIRST_ONBOARDING_SCREEN,
                  onboardingProps
                )

                // Traverse through the onboarding path from FIRST_ONBOARDING_SCREEN to END_OF_ONBOARDING_SCREEN
                // @ts-ignore: Compiler doesn't understand that navigate() can update currentScreen
                while (currentScreen !== END_OF_ONBOARDING_SCREEN) {
                  const screenInfo = _getScreenInfo({
                    screen: currentScreen,
                    navigator: {
                      navigate,
                      popToScreen: () => {
                        // no-op
                      },
                      navigateHome,
                      navigateClearingStack: navigate,
                    },
                    dispatch: () => {
                      // no-op
                    },
                    props: onboardingProps,
                  })
                  if (!screenInfo) {
                    continue
                  }
                  // Verify that the steps are incrementing by 1 each navigation and
                  // that the total remains the same throughout a path traversal
                  const steps = getOnboardingStepValues(currentScreen, onboardingProps)
                  try {
                    expect(steps.step).toEqual(stepCounter)
                    expect(steps.totalSteps).toEqual(totalSteps)
                  } catch (e) {
                    throw new Error(
                      `Onboarding props ${JSON.stringify(
                        onboardingProps
                      )} at screen ${currentScreen} has stepCounter ${
                        steps.step
                      } and totalCounter ${
                        steps.totalSteps
                      } instead of ${stepCounter} and ${totalSteps}.`
                    )
                  }

                  // Go to the next screen
                  screenInfo?.next()
                }

                // Verify that the path traversal ends at END_OF_ONBOARDING_SCREEN
                try {
                  expect(currentScreen).toEqual(END_OF_ONBOARDING_SCREEN)
                } catch (e) {
                  throw new Error(
                    `Navigating with onboarding props ${JSON.stringify(
                      onboardingProps
                    )} terminates at ${currentScreen} instead of ${END_OF_ONBOARDING_SCREEN}.`
                  )
                }
              })
            })
          })
        })
      })
    })
  })

  describe('goToNextOnboardingScreen', () => {
    const onboardingProps = mockOnboardingProps
    beforeEach(() => {
      mockStore.dispatch.mockClear()
    })
    describe('Screens.EnableBiometry', () => {
      it('should navigate to the home screen and initialize account if skipVerification is true', () => {
        goToNextOnboardingScreen(Screens.EnableBiometry, onboardingProps)
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should navigate to ImportWallet if choseToRestoreAccount is true', () => {
        goToNextOnboardingScreen(Screens.EnableBiometry, {
          ...onboardingProps,
          choseToRestoreAccount: true,
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should naigate to VerficationStartScreen if skipVerification is false and choseToRestoreAccount is false', () => {
        goToNextOnboardingScreen(Screens.EnableBiometry, {
          ...onboardingProps,
          skipVerification: false,
          choseToRestoreAccount: false,
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen)
      })
    })
    describe('Screens.NameAndPicture', () => {
      it('should navigate to ImportWallet if recoveringFromStoreWipe is true', () => {
        goToNextOnboardingScreen(Screens.NameAndPicture, onboardingProps)
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should navigate to PincodeSet if recoveringFromStoreWipe is false', () => {
        goToNextOnboardingScreen(Screens.NameAndPicture, {
          ...onboardingProps,
          recoveringFromStoreWipe: false,
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
      })
    })
    describe('Screens.PincodeSet', () => {
      it('should navigate to EnableBiometry if supportedBiometryType is not null', () => {
        goToNextOnboardingScreen(Screens.PincodeSet, {
          ...onboardingProps,
          supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.EnableBiometry)
      })
      it('should navigate to ImportWallet and popToScreen if choseToRestoreAccount is true', () => {
        goToNextOnboardingScreen(Screens.PincodeSet, {
          ...onboardingProps,
          choseToRestoreAccount: true,
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(popToScreen).toHaveBeenCalledWith(Screens.Welcome)
        expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet)
      })
      it('should navigate to the home screen and initialize account if skipVerification is true', () => {
        goToNextOnboardingScreen(Screens.PincodeSet, onboardingProps)
        expect(mockStore.dispatch).toHaveBeenCalledWith(initializeAccount())
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should otherwise navigate to VerificationStartScreen clearing the stack', () => {
        goToNextOnboardingScreen(Screens.PincodeSet, {
          ...onboardingProps,
          skipVerification: false,
          choseToRestoreAccount: false,
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigateClearingStack).toHaveBeenCalledWith(Screens.VerificationStartScreen)
      })
    })
    describe('Screens.ImportWallet', () => {
      it('should navigate to the home screen if skipVerification is true', () => {
        goToNextOnboardingScreen(Screens.ImportWallet, onboardingProps)
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should also navigate to the home screen if numberAlreadyVerifiedCentrally is true', () => {
        goToNextOnboardingScreen(Screens.ImportWallet, {
          ...onboardingProps,
          skipVerification: false,
          numberAlreadyVerifiedCentrally: true,
        })
        expect(mockStore.dispatch).toHaveBeenCalledWith(setHasSeenVerificationNux(true))
        expect(navigateHome).toHaveBeenCalled()
      })
      it('should otherwise navigate to VerificationStartScreen', () => {
        goToNextOnboardingScreen(Screens.ImportWallet, {
          ...onboardingProps,
          skipVerification: false,
        })
        expect(mockStore.dispatch).not.toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen)
      })
    })
    describe('Screens.VerificationStartScreen', () => {
      it('should navigate to the home screen', () => {
        goToNextOnboardingScreen(Screens.VerificationStartScreen, onboardingProps)
        expect(navigateHome).toHaveBeenCalled()
      })
    })
  })
})
