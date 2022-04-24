import { StackScreenProps } from '@react-navigation/stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { setFriendlyName, setPromptForno } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { hideAlert, showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { registrationStepsSelector } from 'src/app/selectors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DevSkipButton from 'src/components/DevSkipButton'
import FormInput from 'src/components/FormInput'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useTypedSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { useAsyncKomenciReadiness } from 'src/verify/hooks'

type Props = StackScreenProps<StackParamList, Screens.FriendlyName>

const FriendlyName = ({ navigation }: Props) => {
  const [friendlyNameInput, setFriendlyNameInput] = useState('')
  const cachedFriendlyName = useTypedSelector((state) => state.account.friendlyName)
  const choseToRestoreAccount = useTypedSelector((state) => state.account.choseToRestoreAccount)
  const recoveringFromStoreWipe = useTypedSelector(recoveringFromStoreWipeSelector)
  const { step, totalSteps } = useTypedSelector(registrationStepsSelector)
  const dispatch = useDispatch()

  const { t } = useTranslation()

  // CB TEMPORARY HOTFIX: Pinging Komenci endpoint to ensure availability
  const asyncKomenciReadiness = useAsyncKomenciReadiness()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <HeaderTitleWithSubtitle
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

    const newFriendlyName = friendlyNameInput.trim()

    if (cachedFriendlyName === newFriendlyName) {
      goToNextScreen()
      return
    }

    if (!newFriendlyName) {
      dispatch(showError(ErrorMessages.MISSING_FRIENDLY_NAME))
      return
    }

    dispatch(setPromptForno(true)) // Allow forno prompt after Welcome screen
    ValoraAnalytics.track(OnboardingEvents.friendlyName_set)
    dispatch(setFriendlyName(newFriendlyName))

    // TODO: I have no idea what CIP-8 is. Find out what it is and maybe store friendly name there ?
    goToNextScreen()
  }

  return (
    <SafeAreaView style={styles.container}>
      <DevSkipButton nextScreen={Screens.PincodeSet} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
        <FormInput
          label={t('friendlyName')}
          style={styles.name}
          onChangeText={setFriendlyNameInput}
          value={friendlyNameInput}
          enablesReturnKeyAutomatically={true}
          placeholder={t('friendlyNamePlaceholder')}
          testID={'FriendlyNameEntry'}
          multiline={false}
        />
        <Button
          onPress={onPressContinue}
          text={t('next')}
          size={BtnSizes.MEDIUM}
          type={BtnTypes.ONBOARDING}
          disabled={!friendlyNameInput.trim()}
          testID={'FriendlyNameContinueButton'}
          showLoading={asyncKomenciReadiness.loading}
        />
      </ScrollView>
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

FriendlyName.navOptions = nuxNavigationOptions

export default FriendlyName

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
