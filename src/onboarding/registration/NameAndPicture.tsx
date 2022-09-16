import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setName, setPicture } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { hideAlert, showError } from 'src/alert/actions'
import { ExperimentParams } from 'src/analytics/constants'
import { OnboardingEvents } from 'src/analytics/Events'
import { StatsigLayers } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { createAccountCopyTestTypeSelector, registrationStepsSelector } from 'src/app/selectors'
import { CreateAccountCopyTestType } from 'src/app/types'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DevSkipButton from 'src/components/DevSkipButton'
import FormInput from 'src/components/FormInput'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import PictureInput from 'src/onboarding/registration/PictureInput'
import { default as useSelector, default as useTypedSelector } from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { saveProfilePicture } from 'src/utils/image'
import Logger from 'src/utils/Logger'
import { useAsyncKomenciReadiness } from 'src/verify/hooks'
import { Statsig, useLayer } from 'statsig-react-native'

type Props = StackScreenProps<StackParamList, Screens.NameAndPicture>

function NameAndPicture({ navigation }: Props) {
  const statsigLayer = StatsigLayers.NAME_AND_PICTURE_SCREEN
  const showSkipButton = useLayer(statsigLayer).layer.get(
    ExperimentParams[statsigLayer].showSkipButton.paramName,
    ExperimentParams[statsigLayer].showSkipButton.defaultValue
  )
  const nameType = useLayer(statsigLayer).layer.get(
    ExperimentParams[statsigLayer].nameType.paramName,
    ExperimentParams[statsigLayer].nameType.defaultValue
  )

  //TODO: use these in an experiment
  Logger.info('NameAndPicture', 'Statsig experiment showSkipButton', showSkipButton)
  Logger.info('NameAndPicture', 'Statsig experiment nameType', nameType)

  const [nameInput, setNameInput] = useState('')
  const cachedName = useTypedSelector((state) => state.account.name)
  const picture = useTypedSelector((state) => state.account.pictureUri)
  const choseToRestoreAccount = useTypedSelector((state) => state.account.choseToRestoreAccount)
  const recoveringFromStoreWipe = useTypedSelector(recoveringFromStoreWipeSelector)
  const { step, totalSteps } = useTypedSelector(registrationStepsSelector)
  const shouldSkipProfilePicture = useTypedSelector((state) => state.app.skipProfilePicture)
  const dispatch = useDispatch()

  const { t } = useTranslation()

  // CB TEMPORARY HOTFIX: Pinging Komenci endpoint to ensure availability
  const asyncKomenciReadiness = useAsyncKomenciReadiness()

  const createAccountCopyTestType = useSelector(createAccountCopyTestTypeSelector)

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          title={t(
            choseToRestoreAccount
              ? 'restoreAccount'
              : createAccountCopyTestType === CreateAccountCopyTestType.Wallet ||
                createAccountCopyTestType === CreateAccountCopyTestType.AlreadyHaveWallet
              ? 'createProfile'
              : 'createAccount'
          )}
          subTitle={t('registrationSteps', { step, totalSteps })}
        />
      ),
    })
  }, [navigation, choseToRestoreAccount, step, totalSteps])

  const goToNextScreen = () => {
    if (recoveringFromStoreWipe) {
      navigate(Screens.ImportWallet)
    } else {
      navigate(Screens.PincodeSet, {
        komenciAvailable: !!asyncKomenciReadiness.result,
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

    Statsig.logEvent('name_step_complete')
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
        <FormInput
          label={t('fullName')}
          style={styles.name}
          onChangeText={setNameInput}
          value={nameInput}
          enablesReturnKeyAutomatically={true}
          placeholder={t('fullNamePlaceholder')}
          testID={'NameEntry'}
          multiline={false}
        />
        <Button
          onPress={onPressContinue}
          text={t('next')}
          size={BtnSizes.MEDIUM}
          type={BtnTypes.ONBOARDING}
          disabled={!nameInput.trim()}
          testID={'NameAndPictureContinueButton'}
          showLoading={asyncKomenciReadiness.loading}
        />
      </ScrollView>
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
})
