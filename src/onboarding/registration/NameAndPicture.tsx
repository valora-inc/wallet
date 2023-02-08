import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setName, setPicture, setPromptForno } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { hideAlert, showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { registrationStepsSelector } from 'src/app/selectors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DevSkipButton from 'src/components/DevSkipButton'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import PictureInput from 'src/onboarding/registration/PictureInput'
import useTypedSelector from 'src/redux/useSelector'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { saveProfilePicture } from 'src/utils/image'
import { useAsyncKomenciReadiness } from 'src/verify/hooks'
type Props = StackScreenProps<StackParamList, Screens.NameAndPicture>

function NameAndPicture({ navigation }: Props) {
  const [nameInput, setNameInput] = useState('')
  const cachedName = useTypedSelector((state) => state.account.name)
  const picture = useTypedSelector((state) => state.account.pictureUri)
  const choseToRestoreAccount = useTypedSelector((state) => state.account.choseToRestoreAccount)
  const recoveringFromStoreWipe = useTypedSelector(recoveringFromStoreWipeSelector)
  const { step, totalSteps } = useTypedSelector(registrationStepsSelector)
  const shouldSkipProfilePicture = useTypedSelector((state) => state.app.skipProfilePicture)
  const dispatch = useDispatch()
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()

  const { t } = useTranslation()

  // CB TEMPORARY HOTFIX: Pinging Komenci endpoint to ensure availability
  const asyncKomenciReadiness = useAsyncKomenciReadiness()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          titleStyle={{ color: Colors.light }}
          subtitleStyle={{ color: Colors.greenFaint }}
          title={t(choseToRestoreAccount ? 'restoreAccount' : 'createAccount')}
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

    dispatch(setPromptForno(true)) // Allow forno prompt after Welcome screen
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
      <KeyboardAvoidingView
        behavior="padding"
        style={[
          headerHeight ? { marginTop: headerHeight } : undefined,
          styles.accessibleView,
          insets && { marginBottom: insets.bottom },
        ]}
      >
        <PictureInput
          picture={picture}
          onPhotoChosen={onPhotoChosen}
          backgroundColor={colors.goldBrand}
        />
        <View style={styles.inputGroup}>
          <Text style={styles.verifyLabel}>{t('fullNamePrompt')}</Text>
          <TextInput
            value={nameInput}
            autoCapitalize="none"
            autoCorrect={false}
            caretHidden={true}
            placeholder={t('fullNamePlaceholder')}
            placeholderTextColor={Colors.greenFaint}
            style={styles.nameInput}
            testID={'NameEntry'}
            keyboardType={'ascii-capable'}
            onChangeText={setNameInput}
          />
        </View>
        <View style={[styles.inputGroup, styles.footerGroup]}>
          <Button
            style={styles.submitButton}
            onPress={onPressContinue}
            text={t('next')}
            size={BtnSizes.MEDIUM}
            type={BtnTypes.BRAND_PRIMARY}
            testID={'NameAndPictureContinueButton'}
            disabled={!nameInput.trim()}
            showLoading={asyncKomenciReadiness.loading}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

NameAndPicture.navOptions = nuxNavigationOptions

export default NameAndPicture
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greenUI,
  },
  accessibleView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    flexGrow: 1,
    paddingTop: 32,
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  footerGroup: {
    justifyContent: 'flex-end',
  },
  nameInput: {
    ...fontStyles.hero,
    color: Colors.light,
  },
  verifyLabel: {
    ...fontStyles.hero,
    color: Colors.light,
  },
  submitButton: {
    justifyContent: 'center',
  },
})
