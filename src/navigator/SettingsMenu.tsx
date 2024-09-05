import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as Sentry from '@sentry/react-native'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { ScrollView } from 'react-native-gesture-handler'
import LinearGradient from 'react-native-linear-gradient'
import { clearStoredAccount, devModeTriggerClicked, toggleBackupState } from 'src/account/actions'
import {
  defaultCountryCodeSelector,
  devModeSelector,
  e164NumberSelector,
  nameSelector,
} from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { resetAppOpenedState, setNumberVerified, setSessionId } from 'src/app/actions'
import {
  phoneNumberVerifiedSelector,
  sessionIdSelector,
  walletConnectEnabledSelector,
} from 'src/app/selectors'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import SessionId from 'src/components/SessionId'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import Touchable from 'src/components/Touchable'
import Envelope from 'src/icons/Envelope'
import ForwardChevron from 'src/icons/ForwardChevron'
import Lock from 'src/icons/Lock'
import Preferences from 'src/icons/Preferences'
import Stack from 'src/icons/Stack'
import Help from 'src/icons/navigator/Help'
import Wallet from 'src/icons/navigator/Wallet'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors, { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { parsePhoneNumber } from 'src/utils/phoneNumbers'
import { selectSessions } from 'src/walletConnect/selectors'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.SettingsMenu>

function GradientDivider() {
  return (
    <LinearGradient
      colors={['#26D98A', '#FFD52C']}
      locations={[0, 0.8915]}
      useAngle={true}
      angle={90}
      style={styles.linearGradient}
    />
  )
}

function ProfileMenuOption() {
  const displayName = useSelector(nameSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const displayNumber =
    e164PhoneNumber && defaultCountryCode
      ? parsePhoneNumber(e164PhoneNumber, defaultCountryCode)?.displayNumberInternational
      : undefined

  const renderContent = () => {
    if (displayNumber && phoneNumberVerified && displayName) {
      return (
        <View style={styles.profileContent}>
          <Text
            numberOfLines={1}
            style={styles.primaryProfileLabel}
            testID="SettingsMenu/Profile/Username"
          >
            {displayName}
          </Text>
          <Text style={styles.secondaryProfileLabel} testID="SettingsMenu/Profile/Number">
            {displayNumber}
          </Text>
        </View>
      )
    } else if (displayNumber && phoneNumberVerified) {
      return (
        <View style={styles.profileContent}>
          <Text style={styles.primaryProfileLabel} testID="SettingsMenu/Profile/Number">
            {displayNumber}
          </Text>
        </View>
      )
    } else if (displayName) {
      return (
        <View style={styles.profileContent}>
          <Text style={styles.primaryProfileLabel} testID="SettingsMenu/Profile/Username">
            {displayName}
          </Text>
        </View>
      )
    }
    return null
  }

  return (
    <Touchable
      style={styles.profileTouchable}
      onPress={() => navigate(Screens.ProfileSubmenu)}
      testID="SettingsMenu/Profile"
    >
      <View style={styles.profileContainer}>
        <ContactCircleSelf size={48} />
        {renderContent()}
        <ForwardChevron color={colors.gray3} height={12} />
      </View>
    </Touchable>
  )
}

export default function SettingsMenu({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const account = useSelector(walletAddressSelector)

  const appVersion = deviceInfoModule.getVersion()

  const { v2 } = useSelector(walletConnectEnabledSelector)
  const { sessions } = useSelector(selectSessions)
  const walletConnectEnabled = v2
  const connectedDapps = sessions?.length

  const sessionId = useSelector(sessionIdSelector)
  const devModeActive = useSelector(devModeSelector)
  const numberVerified = useSelector(phoneNumberVerifiedSelector)

  useEffect(() => {
    if (AppAnalytics.getSessionId() !== sessionId) {
      dispatch(setSessionId(sessionId))
    }
  }, [])

  const toggleNumberVerified = () => {
    dispatch(setNumberVerified(numberVerified))
  }

  const handleResetAppOpenedState = () => {
    Logger.showMessage('App onboarding state reset.')
    dispatch(resetAppOpenedState())
  }

  const handleToggleBackupState = () => {
    dispatch(toggleBackupState())
  }

  const showDebugScreen = () => {
    navigate(Screens.Debug)
  }

  const showDebugImagesScreen = () => {
    navigate(Screens.DebugImages)
  }

  const wipeReduxStore = () => {
    dispatch(clearStoredAccount(account ?? '', true))
  }

  const confirmAccountRemoval = () => {
    AppAnalytics.track(SettingsEvents.completed_account_removal)
    dispatch(clearStoredAccount(account ?? ''))
  }

  const onDevSettingsTriggerPress = () => {
    dispatch(devModeTriggerClicked())
  }

  const getDevSettingsComp = () => {
    if (!devModeActive) {
      return null
    } else {
      return (
        <View style={styles.devSettings}>
          <View style={styles.devSettingsItem}>
            <Text style={typeScale.labelSemiBoldSmall}>Session ID</Text>
            <SessionId sessionId={sessionId || ''} />
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={toggleNumberVerified}>
              <Text>Toggle verification done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={handleResetAppOpenedState}>
              <Text>Reset app opened state</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={handleToggleBackupState}>
              <Text>Toggle backup state</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={showDebugScreen}>
              <Text>Show Debug Screen</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={Sentry.nativeCrash}>
              <Text>Trigger a crash</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={wipeReduxStore}>
              <Text>Wipe Redux Store</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={confirmAccountRemoval}>
              <Text>App Quick Reset</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={showDebugImagesScreen}>
              <Text>See app assets</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }
  }

  return (
    <SafeAreaView>
      <ScrollView>
        <ProfileMenuOption />
        <SettingsItemTextValue
          icon={<Wallet size={24} color={colors.black} />}
          title={t('address')}
          onPress={() =>
            navigate(Screens.QRNavigator, {
              screen: Screens.QRCode,
              params: { showSecureSendStyling: true },
            })
          }
          testID="SettingsMenu/Address"
          showChevron
          borderless
        />
        <SettingsItemTextValue
          icon={<Envelope color={colors.black} />}
          title={t('invite')}
          onPress={() => navigate(Screens.Invite)}
          testID="SettingsMenu/Invite"
          showChevron
          borderless
        />

        <GradientDivider />

        <SettingsItemTextValue
          icon={<Preferences size={24} />}
          title={t('preferences')}
          testID="SettingsMenu/Preferences"
          onPress={() => navigate(Screens.PreferencesSubmenu)}
          showChevron
          borderless
        />
        <SettingsItemTextValue
          icon={<Lock width={24} height={24} color={colors.black} />}
          title={t('securityPrivacy')}
          testID="SettingsMenu/Security"
          onPress={() => navigate(Screens.SecuritySubmenu)}
          showChevron
          borderless
        />
        {walletConnectEnabled && (
          <SettingsItemTextValue
            icon={<Stack size={24} color={colors.black} />}
            title={t('connectedApplications')}
            testID="SettingsMenu/ConnectedDapps"
            value={connectedDapps.toString()}
            onPress={() => navigate(Screens.WalletConnectSessions)}
            showChevron
            borderless
          />
        )}
        <SettingsItemTextValue
          icon={<Help size={24} color={Colors.black} />}
          title={t('help')}
          onPress={() => navigate(Screens.Support)}
          testID="SettingsMenu/Help"
          showChevron
          borderless
        />

        <GradientDivider />

        <SettingsItemTextValue
          title={t('legal')}
          testID="SettingsMenu/Legal"
          onPress={() => navigate(Screens.LegalSubmenu)}
          showChevron
          borderless
        />
        <TouchableWithoutFeedback onPress={onDevSettingsTriggerPress}>
          <View style={styles.appVersionContainer} testID="SettingsMenu/Version">
            <Text style={styles.appVersionText}>{t('appVersion')}</Text>
            <Text style={styles.appVersionText}>{appVersion}</Text>
          </View>
        </TouchableWithoutFeedback>
        {getDevSettingsComp()}
      </ScrollView>
    </SafeAreaView>
  )
}

SettingsMenu.navigationOptions = () => ({
  ...headerWithCloseButton,
})

const styles = StyleSheet.create({
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileTouchable: {
    paddingTop: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
    paddingHorizontal: variables.contentPadding,
  },
  profileContent: {
    alignContent: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingLeft: Spacing.Smallest8,
  },
  primaryProfileLabel: {
    ...typeScale.labelSemiBoldMedium,
  },
  secondaryProfileLabel: {
    ...typeScale.bodyMedium,
    color: colors.gray3,
  },
  border: {
    marginVertical: Spacing.Smallest8,
    marginHorizontal: Spacing.Regular16,
    height: 1,
    backgroundColor: colors.gray2,
    alignSelf: 'stretch',
  },
  appVersionContainer: {
    flexDirection: 'row',
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: variables.contentPadding,
  },
  appVersionText: {
    ...typeScale.bodyMedium,
    color: colors.gray3,
  },
  devSettings: {
    alignItems: 'flex-start',
    padding: Spacing.Regular16,
    marginHorizontal: Spacing.Smallest8,
  },
  devSettingsItem: {
    alignSelf: 'stretch',
    margin: Spacing.Tiny4,
  },

  linearGradient: {
    marginVertical: Spacing.Smallest8,
    marginHorizontal: Spacing.Regular16,
    height: 1,
  },
})
