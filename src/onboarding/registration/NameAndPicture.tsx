import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { setName } from 'src/account/actions'
import { nameSelector } from 'src/account/selectors'
import { hideAlert, showError } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DevSkipButton from 'src/components/DevSkipButton'
import FormInput from 'src/components/FormInput'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { HeaderTitleWithSubtitle, nuxNavigationOptionsOnboarding } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import {
  getOnboardingStepValues,
  goToNextOnboardingScreen,
  onboardingPropsSelector,
} from 'src/onboarding/steps'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

type Props = NativeStackScreenProps<StackParamList, Screens.NameAndPicture>
function NameAndPicture({ navigation, route }: Props) {
  const [nameInput, setNameInput] = useState('')
  const cachedName = useSelector(nameSelector)
  const choseToRestoreAccount = useSelector((state) => state.account.choseToRestoreAccount)
  const onboardingProps = useSelector(onboardingPropsSelector)
  const { step, totalSteps } = getOnboardingStepValues(Screens.NameAndPicture, onboardingProps)
  const dispatch = useDispatch()

  const { t } = useTranslation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => {
        return (
          <HeaderTitleWithSubtitle
            title={t('name')}
            subTitle={t('registrationSteps', { step, totalSteps })}
          />
        )
      },
      headerRight: () => (
        <TopBarTextButton
          title={t('skip')}
          onPress={() => {
            ValoraAnalytics.track(OnboardingEvents.name_and_picture_skip)
            goToNextScreen()
          }}
          titleStyle={{ color: colors.onboardingBrownLight }}
        />
      ),
    })
  }, [navigation, choseToRestoreAccount, step, totalSteps, nameInput])

  const goToNextScreen = () => {
    goToNextOnboardingScreen({ firstScreenInCurrentStep: Screens.NameAndPicture, onboardingProps })
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
      profilePictureSkipped: true,
    })
    dispatch(setName(newName))

    // TODO: Store name and picture on CIP-8.
    goToNextScreen()
  }

  return (
    <SafeAreaView style={styles.container}>
      <DevSkipButton nextScreen={Screens.PincodeSet} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
        <Text style={styles.guidedOnboardingHeader}>{t('nameAndPicGuideCopyTitle')}</Text>
        <Text style={styles.guidedOnboardingCopy}>{t('nameAndPicGuideCopyContent')}</Text>
        <FormInput
          label={t('fullNameOrPsuedonym')}
          style={styles.name}
          onChangeText={setNameInput}
          value={nameInput}
          enablesReturnKeyAutomatically={true}
          placeholder={t('namePlaceholder') ?? undefined}
          testID={'NameEntry'}
          multiline={false}
        />
        <Button
          onPress={onPressContinue}
          text={t('next')}
          size={BtnSizes.FULL}
          type={BtnTypes.ONBOARDING}
          disabled={!nameInput?.trim()}
          testID={'NameAndPictureContinueButton'}
        />
      </ScrollView>
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

NameAndPicture.navOptions = nuxNavigationOptionsOnboarding

export default NameAndPicture

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 40,
  },
  name: {
    marginVertical: 32,
  },
  guidedOnboardingCopy: {
    textAlign: 'center',
    marginTop: 16,
    ...fontStyles.regular,
  },
  guidedOnboardingHeader: {
    textAlign: 'center',
    marginTop: 36,
    ...fontStyles.h1,
  },
})
