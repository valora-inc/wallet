import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import FormInput from '@celo/react-components/components/FormInput'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setName, setPicture, setPromptForno } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { hideAlert, showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import i18n, { Namespaces } from 'src/i18n'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import PictureInput from 'src/onboarding/registration/PictureInput'
import useTypedSelector from 'src/redux/useSelector'
import { saveProfilePicture } from 'src/utils/image'
import { useAsyncKomenciReadiness } from 'src/verify/hooks'

type Props = StackScreenProps<StackParamList, Screens.NameAndPicture>

function NameAndPicture({ navigation }: Props) {
  const [nameInput, setNameInput] = useState('')
  const cachedName = useTypedSelector((state) => state.account.name)
  const picture = useTypedSelector((state) => state.account.pictureUri)
  const choseToRestoreAccount = useTypedSelector((state) => state.account.choseToRestoreAccount)
  const recoveringFromStoreWipe = useTypedSelector(recoveringFromStoreWipeSelector)
  const dispatch = useDispatch()

  const { t } = useTranslation(Namespaces.nuxNamePin1)

  // CB TEMPORARY HOTFIX: Pinging Komenci endpoint to ensure availability
  const asyncKomenciReadiness = useAsyncKomenciReadiness()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          title={i18n.t(
            choseToRestoreAccount ? 'onboarding:restoreAccount' : 'onboarding:createAccount'
          )}
          subTitle={i18n.t('onboarding:step', { step: '1' })}
        />
      ),
    })
  }, [navigation, choseToRestoreAccount])

  const goToNextScreen = () => {
    if (recoveringFromStoreWipe) {
      navigate(Screens.ImportWallet)
    } else {
      navigate(Screens.PincodeSet, { komenciAvailable: !!asyncKomenciReadiness.result })
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

    dispatch(setPromptForno(true)) // Allow forno prompt after Welcome screen
    ValoraAnalytics.track(OnboardingEvents.name_and_picture_set, {
      includesPhoto: false,
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
        <PictureInput
          picture={picture}
          onPhotoChosen={onPhotoChosen}
          backgroundColor={colors.onboardingBrownLight}
        />
        <FormInput
          label={t('fullName')}
          style={styles.name}
          onChangeText={setNameInput}
          value={nameInput}
          enablesReturnKeyAutomatically={true}
          placeholder={t('fullNamePlaceholder')}
          testID={'NameEntry'}
          multiline={true}
        />
        <Button
          onPress={onPressContinue}
          text={t('global:next')}
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
    flex: 1,
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
