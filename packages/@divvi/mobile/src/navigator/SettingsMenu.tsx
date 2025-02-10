import Clipboard from '@react-native-clipboard/clipboard'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
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
import { clearStoredAccount, devModeTriggerClicked } from 'src/account/actions'
import {
  defaultCountryCodeSelector,
  devModeSelector,
  e164NumberSelector,
  nameSelector,
} from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SettingsEvents } from 'src/analytics/Events'
import { setSessionId } from 'src/app/actions'
import { phoneNumberVerifiedSelector, sessionIdSelector } from 'src/app/selectors'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import GradientBlock from 'src/components/GradientBlock'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import Touchable from 'src/components/Touchable'
import { STATSIG_ENABLED } from 'src/config'
import Envelope from 'src/icons/Envelope'
import ForwardChevron from 'src/icons/ForwardChevron'
import Help from 'src/icons/Help'
import Lock from 'src/icons/Lock'
import Wallet from 'src/icons/navigator/Wallet'
import Preferences from 'src/icons/Preferences'
import Stack from 'src/icons/Stack'
import DivviLogo from 'src/images/DivviLogo'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { parsePhoneNumber } from 'src/utils/phoneNumbers'
import { selectSessions } from 'src/walletConnect/selectors'
import { walletAddressSelector } from 'src/web3/selectors'
import { Statsig } from 'statsig-react-native'

type Props = NativeStackScreenProps<StackParamList, Screens.SettingsMenu>

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
        <ForwardChevron color={Colors.contentSecondary} height={12} />
      </View>
    </Touchable>
  )
}

export default function SettingsMenu({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const account = useSelector(walletAddressSelector)

  const appVersion = deviceInfoModule.getVersion()
  const buildNumber = deviceInfoModule.getBuildNumber()

  const { sessions } = useSelector(selectSessions)
  const walletConnectV2Disabled = getFeatureGate(StatsigFeatureGates.DISABLE_WALLET_CONNECT_V2)
  const connectedDapps = sessions?.length

  const sessionId = useSelector(sessionIdSelector)
  const devModeActive = useSelector(devModeSelector)

  useEffect(() => {
    if (AppAnalytics.getSessionId() !== sessionId) {
      dispatch(setSessionId(AppAnalytics.getSessionId()))
    }
  }, [])

  const showDebugImagesScreen = () => {
    navigate(Screens.DebugImages)
  }

  const confirmAccountRemoval = () => {
    AppAnalytics.track(SettingsEvents.completed_account_removal)
    dispatch(clearStoredAccount(account ?? ''))
  }

  const onDevSettingsTriggerPress = () => {
    dispatch(devModeTriggerClicked())
  }

  const onCopyText = (...text: Array<string | null>) => {
    return () => {
      Logger.showMessage('Copied to Clipboard')
      Clipboard.setString(text.join(', '))
    }
  }

  const getDevSettingsComp = () => {
    if (!devModeActive) {
      return null
    } else {
      const statsigStableId = STATSIG_ENABLED ? Statsig.getStableID() : 'statsig-not-enabled'
      return (
        <View style={styles.devSettings}>
          <Touchable onPress={onCopyText(sessionId)} style={styles.devSettingsItem}>
            <Text style={styles.debugInfoText}>{`Session ID: ${sessionId}`}</Text>
          </Touchable>
          <Touchable onPress={onCopyText(statsigStableId)} style={styles.devSettingsItem}>
            <Text style={styles.debugInfoText}>{`Statsig Stable ID: ${statsigStableId}`}</Text>
          </Touchable>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={showDebugImagesScreen}>
              <Text style={styles.debugInfoText}>See App Assets</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={confirmAccountRemoval}>
              <Text style={styles.debugInfoText}>App Quick Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ProfileMenuOption />
        <SettingsItemTextValue
          icon={<Wallet size={24} color={Colors.contentPrimary} />}
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
          icon={<Envelope color={Colors.contentPrimary} />}
          title={t('invite')}
          onPress={() => navigate(Screens.Invite)}
          testID="SettingsMenu/Invite"
          showChevron
          borderless
        />

        <GradientBlock style={styles.divider} />

        <SettingsItemTextValue
          icon={<Preferences size={24} />}
          title={t('preferences')}
          testID="SettingsMenu/Preferences"
          onPress={() => navigate(Screens.PreferencesSubmenu)}
          showChevron
          borderless
        />
        <SettingsItemTextValue
          icon={<Lock width={24} height={24} color={Colors.contentPrimary} />}
          title={t('securityPrivacy')}
          testID="SettingsMenu/Security"
          onPress={() => navigate(Screens.SecuritySubmenu)}
          showChevron
          borderless
        />
        {!walletConnectV2Disabled && (
          <SettingsItemTextValue
            icon={<Stack size={24} color={Colors.contentPrimary} />}
            title={t('connectedApplications')}
            testID="SettingsMenu/ConnectedDapps"
            value={connectedDapps.toString()}
            onPress={() => navigate(Screens.WalletConnectSessions)}
            showChevron
            borderless
          />
        )}
        <SettingsItemTextValue
          icon={<Help size={24} color={Colors.contentPrimary} />}
          title={t('help')}
          onPress={() => navigate(Screens.Support)}
          testID="SettingsMenu/Help"
          showChevron
          borderless
        />

        <GradientBlock style={styles.divider} />

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
            <Text style={styles.appVersionText}>{`${appVersion} (${buildNumber})`}</Text>
          </View>
        </TouchableWithoutFeedback>
        {getDevSettingsComp()}
        <View style={styles.logo}>
          <DivviLogo />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

SettingsMenu.navigationOptions = () => ({
  ...headerWithCloseButton,
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
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
    color: Colors.contentSecondary,
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
    color: Colors.contentSecondary,
  },
  devSettings: {
    alignItems: 'flex-start',
    padding: Spacing.Regular16,
  },
  devSettingsItem: {
    alignSelf: 'stretch',
    marginVertical: Spacing.Smallest8,
  },
  divider: {
    marginVertical: Spacing.Smallest8,
    marginHorizontal: Spacing.Regular16,
  },
  debugInfoText: {
    ...typeScale.bodySmall,
  },
  logo: {
    marginTop: 'auto',
    paddingVertical: Spacing.Thick24,
    alignItems: 'center',
  },
})
