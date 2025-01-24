import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { saveName } from 'src/account/actions'
import { nameSelector } from 'src/account/selectors'
import { showError, showMessage } from 'src/alert/actions'
import { SettingsEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TextInput from 'src/components/TextInput'
import { generateRandomUsername } from 'src/nameGenerator'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import BackButton from 'src/components/BackButton'
import TextButton from 'src/components/TextButton'

type Props = NativeStackScreenProps<StackParamList, Screens.Profile>

function Profile({ navigation }: Props) {
  const { t } = useTranslation()
  const [newName, setNewName] = useState(useSelector(nameSelector) ?? '')
  const exampleName = useMemo(() => generateRandomUsername(), [])

  const dispatch = useDispatch()

  const onSave = () => {
    if (newName.length === 0) {
      dispatch(showError(ErrorMessages.MISSING_FULL_NAME))
      return
    }
    AppAnalytics.track(SettingsEvents.profile_save)
    dispatch(saveName(newName))
    dispatch(showMessage(t('nameSaved')))
    navigation.goBack()
  }

  const updateName = (updatedName: string) => {
    setNewName(updatedName)
  }

  const generateName = () => {
    AppAnalytics.track(SettingsEvents.profile_generate_name)
    updateName(generateRandomUsername())
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAwareScrollView testID="ProfileScrollView">
        <View style={styles.accountProfile}>
          <ContactCircleSelf size={48} />
        </View>
        <Text style={styles.nameLabel}>{t('profileName')}</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder={t('profileScreen.namePlaceholder', { exampleName }) ?? undefined}
            placeholderTextColor={colors.gray3}
            testID="ProfileEditName"
            onChangeText={updateName}
            value={newName ?? t('unknown')}
          />
        </View>
        <View style={styles.ctaContainer}>
          <TextButton
            style={styles.generateButton}
            onPress={generateName}
            testID="GenerateNameButton"
          >
            {t('profileScreen.generateName')}
          </TextButton>
        </View>
      </KeyboardAwareScrollView>
      <View style={styles.bottomSection}>
        <Button
          onPress={onSave}
          text={t('save')}
          testID="SaveButton"
          style={styles.saveButton}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
        />
      </View>
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

Profile.navigationOptions = ({ navigation }: Props) => {
  const onBack = () => {
    AppAnalytics.track(SettingsEvents.profile_cancel)
    navigation.goBack()
  }
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton onPress={onBack} testID="BackButton" />,
  }
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountProfile: {
    paddingLeft: 10,
    paddingTop: 24,
    paddingRight: 15,
    paddingBottom: 37,
    flexDirection: 'column',
    alignItems: 'center',
  },
  inputContainer: {
    height: Spacing.XLarge48,
    paddingHorizontal: Spacing.Small12,
    borderWidth: 1,
    borderRadius: Spacing.Smallest8,
    borderColor: colors.gray2,
    marginHorizontal: Spacing.Thick24,
  },
  ctaContainer: {
    alignItems: 'center',
  },
  generateButton: {
    ...typeScale.labelSemiBoldSmall,
    color: colors.black,
    marginTop: Spacing.Thick24,
  },
  saveButton: {
    ...typeScale.bodyMedium,
    paddingHorizontal: Spacing.Thick24,
    paddingBottom: Spacing.Thick24,
  },
  nameLabel: {
    ...typeScale.labelSemiBoldSmall,
    paddingLeft: Spacing.Thick24,
    paddingBottom: Spacing.Smallest8,
  },
  bottomSection: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    flex: 1,
  },
})
