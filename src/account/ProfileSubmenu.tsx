import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { SettingsEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { SettingsItemTextValue, SettingsExpandedItem } from 'src/components/SettingsItem'
import User from 'src/icons/User'
import { useSelector } from 'src/redux/hooks'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Phone from 'src/icons/Phone'
import RevokePhoneNumber from 'src/RevokePhoneNumber'
import CustomHeader from 'src/components/header/CustomHeader'
import variables from 'src/styles/variables'
import BackButton from 'src/components/BackButton'

type Props = NativeStackScreenProps<StackParamList, Screens.ProfileSubmenu>

export default function ProfileSubmenu(props: Props) {
  const { t } = useTranslation()
  const numberVerified = useSelector(phoneNumberVerifiedSelector)
  const revokeBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const handleShowConfirmRevoke = () => {
    AppAnalytics.track(SettingsEvents.settings_revoke_phone_number)
    revokeBottomSheetRef.current?.snapToIndex(0)
  }

  const goToProfile = () => {
    AppAnalytics.track(SettingsEvents.settings_profile_edit)
    navigate(Screens.Profile)
  }

  const goToConfirmNumber = () => {
    AppAnalytics.track(SettingsEvents.settings_verify_number)
    navigate(Screens.VerificationStartScreen, { hasOnboarded: true })
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader left={<BackButton />} title={t('profile')} style={styles.header} />
      <ScrollView>
        <View>
          <SettingsItemTextValue
            testID="ProfileSubmenu/EditProfile"
            icon={<User />}
            title={t('editProfile')}
            onPress={goToProfile}
            showChevron
          />
          {!numberVerified ? (
            <SettingsItemTextValue
              testID="ProfileSubmenu/Verify"
              icon={<Phone />}
              title={t('confirmNumber')}
              onPress={goToConfirmNumber}
              borderless
              showChevron
            />
          ) : (
            <SettingsExpandedItem
              testID="ProfileSubmenu/Revoke"
              icon={<Phone />}
              title={t('revokePhoneNumber.title')}
              details={t('revokePhoneNumber.description')}
              onPress={handleShowConfirmRevoke}
              borderless
            />
          )}
        </View>
      </ScrollView>
      <RevokePhoneNumber forwardedRef={revokeBottomSheetRef} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: variables.contentPadding,
  },
  container: {
    flex: 1,
  },
})
