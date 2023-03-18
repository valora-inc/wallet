import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import * as RNFS from 'react-native-fs'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { saveNameAndPicture } from 'src/account/actions'
import { nameSelector, pictureSelector } from 'src/account/selectors'
import { showError, showMessage } from 'src/alert/actions'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Button from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import TextInput from 'src/components/TextInput'
import Touchable from 'src/components/Touchable'
import i18n from 'src/i18n'
import { generateRandomUsername } from 'src/nameGenerator'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import PictureInput from 'src/onboarding/registration/PictureInput'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { saveProfilePicture } from 'src/utils/image'
import Logger from 'src/utils/Logger'

type Props = NativeStackScreenProps<StackParamList, Screens.Profile>

function Profile({ navigation, route }: Props) {
  const { t } = useTranslation()
  const [newName, setNewName] = useState(useSelector(nameSelector) ?? '')
  const picturePath = useSelector(pictureSelector)
  const [newPictureUri, setNewPictureUri] = useState(picturePath || null)

  const dispatch = useDispatch()

  const onSave = () => {
    if (newName.length === 0) {
      dispatch(showError(ErrorMessages.MISSING_FULL_NAME))
      return
    }
    ValoraAnalytics.track(SettingsEvents.profile_save)
    dispatch(saveNameAndPicture(newName, newPictureUri))
    dispatch(showMessage(t('namePictureSaved')))
    navigation.goBack()

    // Delete old profile pictures if necessary.
    if (picturePath && picturePath !== newPictureUri) {
      RNFS.unlink(picturePath).catch((e) => {
        Logger.error('Profile', 'Error deleting old profile picture:', e)
      })
    }
  }

  const onPictureChosen = async (pictureDataUrl: string | null) => {
    if (!pictureDataUrl) {
      setNewPictureUri(null)
    } else {
      try {
        const newPicturePath = await saveProfilePicture(pictureDataUrl)
        setNewPictureUri(newPicturePath)
      } catch (error) {
        dispatch(showError(ErrorMessages.PICTURE_LOAD_FAILED))
      }
    }
  }

  const updateName = (updatedName: string) => {
    setNewName(updatedName)
  }

  const generateName = () => {
    ValoraAnalytics.track(SettingsEvents.profile_generate_name)
    updateName(generateRandomUsername())
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView edges={['bottom']}>
        <View style={styles.accountProfile}>
          <PictureInput
            picture={newPictureUri}
            onPhotoChosen={onPictureChosen}
            backgroundColor={colors.gray6}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder={t('profileScreen.namePlaceholder')}
            testID="ProfileEditName"
            onChangeText={updateName}
            value={newName ?? t('unknown')}
          />
        </View>
        <View style={styles.ctaContainer}>
          <Button
            style={styles.generateButton}
            text={t('profileScreen.generateName')}
            onPress={generateName}
            testID="GenerateNameButton"
          />
          <Touchable testID="SaveButton" onPress={onSave}>
            <Text style={styles.saveButton}>{t('save')}</Text>
          </Touchable>
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

Profile.navigationOptions = ({ navigation }: Props) => {
  const onCancel = () => {
    ValoraAnalytics.track(SettingsEvents.profile_cancel)
    navigation.goBack()
  }
  return {
    ...emptyHeader,
    headerTitle: i18n.t('editProfile'),
    headerLeft: () => <CancelButton onCancel={onCancel} />,
  }
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountProfile: {
    paddingLeft: 10,
    paddingTop: 30,
    paddingRight: 15,
    paddingBottom: 15,
    flexDirection: 'column',
    alignItems: 'center',
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
    marginHorizontal: 24,
  },
  ctaContainer: {
    alignItems: 'center',
  },
  generateButton: {
    marginVertical: 24,
  },
  saveButton: {
    ...fontStyles.regular,
    color: colors.greenUI,
  },
})
