import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setName, setPicture } from 'src/account/actions'
import { nameSelector, recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { hideAlert, showError } from 'src/alert/actions'
import { ConfigParams, LayerParams } from 'src/analytics/constants'
import { OnboardingEvents } from 'src/analytics/Events'
import { StatsigDynamicConfigs, StatsigLayers } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  createAccountCopyTestTypeSelector,
  registrationStepsSelector,
  showGuidedOnboardingSelector,
} from 'src/app/selectors'
import { CreateAccountCopyTestType, OnboardingNameType } from 'src/app/types'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DevSkipButton from 'src/components/DevSkipButton'
import FormInput from 'src/components/FormInput'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { generateRandomUsername } from 'src/onboarding/registration/NameGenerator'
import PictureInput from 'src/onboarding/registration/PictureInput'
import { default as useSelector, default as useTypedSelector } from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { saveProfilePicture } from 'src/utils/image'
import Logger from 'src/utils/Logger'
import { useAsyncKomenciReadiness } from 'src/verify/hooks'
import { Statsig } from 'statsig-react-native'

type Props = NativeStackScreenProps<StackParamList, Screens.NameAndPicture>

const getExperimentParams = () => {
  try {
    const statsigLayer = Statsig.getLayer(StatsigLayers.NAME_AND_PICTURE_SCREEN)
    const showSkipButton = statsigLayer.get(
      LayerParams[StatsigLayers.NAME_AND_PICTURE_SCREEN].showSkipButton.paramName,
      LayerParams[StatsigLayers.NAME_AND_PICTURE_SCREEN].showSkipButton.defaultValue
    )
    const nameType = statsigLayer.get(
      LayerParams[StatsigLayers.NAME_AND_PICTURE_SCREEN].nameType.paramName,
      LayerParams[StatsigLayers.NAME_AND_PICTURE_SCREEN].nameType.defaultValue
    )
    return [showSkipButton, nameType]
  } catch (error) {
    Logger.warn('NameAndPicture', 'error getting Statsig experiment', error)
  }
  return [
    LayerParams[StatsigLayers.NAME_AND_PICTURE_SCREEN].showSkipButton.defaultValue,
    LayerParams[StatsigLayers.NAME_AND_PICTURE_SCREEN].nameType.defaultValue,
  ]
}

const getBlockedUsernames = (): {
  blockedAdjectives: string[]
  blockedNouns: string[]
} => {
  try {
    const config = Statsig.getConfig(StatsigDynamicConfigs.USERNAME_BLOCK_LIST)
    const blockedAdjectives = config.get(
      ConfigParams[StatsigDynamicConfigs.USERNAME_BLOCK_LIST].blockedAdjectives.paramName,
      ConfigParams[StatsigDynamicConfigs.USERNAME_BLOCK_LIST].blockedAdjectives.defaultValue
    )
    const blockedNouns = config.get(
      ConfigParams[StatsigDynamicConfigs.USERNAME_BLOCK_LIST].blockedNouns.paramName,
      ConfigParams[StatsigDynamicConfigs.USERNAME_BLOCK_LIST].blockedNouns.defaultValue
    )
    return { blockedAdjectives, blockedNouns }
  } catch (error) {
    Logger.warn('NameAndPicture', 'error getting Statsig blocked usernames', error)
  }
  return {
    blockedAdjectives: [],
    blockedNouns: [],
  }
}

function NameAndPicture({ navigation, route }: Props) {
  const [nameInput, setNameInput] = useState('')
  const [showSkipButton, nameType] = useMemo(getExperimentParams, [])
  const { blockedAdjectives, blockedNouns } = useMemo(getBlockedUsernames, [])
  const cachedName = useTypedSelector(nameSelector)
  const picture = useTypedSelector((state) => state.account.pictureUri)
  const choseToRestoreAccount = useTypedSelector((state) => state.account.choseToRestoreAccount)
  const recoveringFromStoreWipe = useTypedSelector(recoveringFromStoreWipeSelector)
  const { step, totalSteps } = useTypedSelector(registrationStepsSelector)
  const shouldSkipProfilePicture = useTypedSelector((state) => state.app.skipProfilePicture)
  const dispatch = useDispatch()

  const { t } = useTranslation()

  // CB TEMPORARY HOTFIX: Pinging Komenci endpoint to ensure availability
  const asyncKomenciReadiness = useAsyncKomenciReadiness()
  const showGuidedOnboarding = useSelector(showGuidedOnboardingSelector)
  const createAccountCopyTestType = useSelector(createAccountCopyTestTypeSelector)
  const showNameGeneratorButton = nameType === OnboardingNameType.AutoGen

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        let pageTitleTranslationKey
        pageTitleTranslationKey = choseToRestoreAccount
          ? 'restoreAccount'
          : createAccountCopyTestType === CreateAccountCopyTestType.Wallet ||
            createAccountCopyTestType === CreateAccountCopyTestType.AlreadyHaveWallet
          ? 'createProfile'
          : 'createAccount'
        if (
          nameType === OnboardingNameType.AutoGen ||
          nameType === OnboardingNameType.Placeholder
        ) {
          // experimental group of Onboarding Name Step experiment
          pageTitleTranslationKey = 'createProfile'
        } else if (showGuidedOnboarding) {
          pageTitleTranslationKey = 'name'
        }

        return (
          <HeaderTitleWithSubtitle
            title={t(pageTitleTranslationKey)}
            subTitle={t('registrationSteps', { step, totalSteps })}
          />
        )
      },
      headerRight: () =>
        showSkipButton && (
          <TopBarTextButton
            title={t('skip')}
            onPress={() => {
              ValoraAnalytics.track(OnboardingEvents.name_and_picture_skip)
              goToNextScreen()
            }}
            titleStyle={{ color: colors.goldDark }}
          />
        ),
    })
  }, [navigation, choseToRestoreAccount, step, totalSteps, nameInput])

  const goToNextScreen = () => {
    if (recoveringFromStoreWipe) {
      navigate(Screens.ImportWallet)
    } else {
      navigate(Screens.PincodeSet, {
        komenciAvailable: !!asyncKomenciReadiness.result,
        showGuidedOnboarding,
      })
    }
  }

  const onPressContinue = () => {
    dispatch(hideAlert())

    const newName = nameInput.trim()

    if (cachedName === newName) {
      goToNextScreen()
      return
    }

    if (!newName) {
      dispatch(showError(ErrorMessages.MISSING_FULL_NAME))
      return
    }

    ValoraAnalytics.track(OnboardingEvents.name_and_picture_set, {
      includesPhoto: false,
      profilePictureSkipped: shouldSkipProfilePicture,
    })
    dispatch(setName(newName))

    // TODO: Store name and picture on CIP-8.
    goToNextScreen()
  }

  const onPhotoChosen = async (dataUrl: string | null) => {
    if (!dataUrl) {
      dispatch(setPicture(null))
    } else {
      try {
        const fileName = await saveProfilePicture(dataUrl)
        dispatch(setPicture(fileName))
      } catch (error) {
        dispatch(showError(ErrorMessages.PICTURE_LOAD_FAILED))
      }
    }
  }
  const getUsernamePlaceholder = (nameType: OnboardingNameType) => {
    // Firebase trusted-guide onboarding experiment

    switch (nameType) {
      case OnboardingNameType.Placeholder:
      case OnboardingNameType.AutoGen:
        // onboarding name step experimental group
        return 'MyCryptoAlterEgo' // not localized
      case OnboardingNameType.FirstAndLast:
      // onboarding name step control group
      default:
        return showGuidedOnboarding ? t('fullNameOrPseudonymPlaceholder') : t('fullNamePlaceholder')
    }
  }

  const onPressGenerateUsername = () => {
    setNameInput(generateRandomUsername(new Set(blockedAdjectives), new Set(blockedNouns)))
    ValoraAnalytics.track(OnboardingEvents.name_and_picture_generate_name)
  }

  return (
    <SafeAreaView style={styles.container}>
      <DevSkipButton nextScreen={Screens.PincodeSet} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
        {!shouldSkipProfilePicture && (
          <PictureInput
            picture={picture}
            onPhotoChosen={onPhotoChosen}
            backgroundColor={colors.onboardingBrownLight}
          />
        )}
        {showGuidedOnboarding && (
          <>
            <Text style={styles.guidedOnboardingHeader}>{t('nameAndPicGuideCopyTitle')}</Text>
            <Text style={styles.guidedOnboardingCopy}>{t('nameAndPicGuideCopyContent')}</Text>
          </>
        )}
        <FormInput
          label={t('fullName')}
          style={styles.name}
          onChangeText={setNameInput}
          value={nameInput}
          enablesReturnKeyAutomatically={true}
          placeholder={getUsernamePlaceholder(nameType as OnboardingNameType)}
          testID={'NameEntry'}
          multiline={false}
        />
        <Button
          onPress={onPressContinue}
          text={t('next')}
          size={BtnSizes.MEDIUM}
          type={BtnTypes.ONBOARDING}
          disabled={!nameInput?.trim()}
          testID={'NameAndPictureContinueButton'}
          showLoading={asyncKomenciReadiness.loading}
        />
      </ScrollView>
      {showNameGeneratorButton && (
        <Button
          onPress={onPressGenerateUsername}
          text={t('generateUsername')}
          size={BtnSizes.MEDIUM}
          type={BtnTypes.ONBOARDING_SECONDARY}
          style={styles.generateUsernameButton}
        />
      )}
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

NameAndPicture.navOptions = nuxNavigationOptions

export default NameAndPicture

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 80,
  },
  name: {
    marginTop: 24,
    marginBottom: 32,
  },
  guidedOnboardingCopy: {
    ...fontStyles.regular,
  },
  guidedOnboardingHeader: {
    marginTop: 36,
    ...fontStyles.h1,
  },
  generateUsernameButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
})
