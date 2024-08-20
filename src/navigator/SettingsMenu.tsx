import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { ScrollView } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'
import { defaultCountryCodeSelector, e164NumberSelector, nameSelector } from 'src/account/selectors'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import Touchable from 'src/components/Touchable'
import Help from 'src/icons/navigator/Help'
import { Invite } from 'src/icons/navigator/Invite'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import colors, { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { getSupportedNetworkIdsForTokenBalances } from 'src/tokens/utils'
import { currentAccountSelector } from 'src/web3/selectors'
import { parsePhoneNumber } from '@celo/phone-utils'
import ForwardChevron from 'src/icons/ForwardChevron'
import Wallet from 'src/icons/navigator/Wallet'
import Preferences from 'src/icons/Preferences'
import Lock from 'src/icons/Lock'
import Stack from 'src/icons/Stack'
import { selectSessions } from 'src/walletConnect/selectors'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import variables from 'src/styles/variables'
import { SettingsItemTextValue } from 'src/components/SettingsItem'

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
    <Touchable style={styles.profileTouchable} testID="SettingsMenu/Profile">
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
  const account = useSelector(currentAccountSelector)
  const appVersion = deviceInfoModule.getVersion()
  const networks = getSupportedNetworkIdsForTokenBalances()
  const networkNames = networks.map((network) => NETWORK_NAMES[network])

  const { v2 } = useSelector(walletConnectEnabledSelector)
  const { sessions } = useSelector(selectSessions)
  const walletConnectEnabled = v2
  const connectedDapps = sessions?.length
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
          icon={<Invite size={24} color={colors.black} />}
          title={t('invite')}
          onPress={() => navigate(Screens.Invite)}
          testID="SettingsMenu/Invite"
          showChevron
          borderless
        />
        <View style={styles.border} />
        <SettingsItemTextValue
          icon={<Preferences size={24} />}
          title={t('preferences')}
          testID="SettingsMenu/Preferences"
          showChevron
          borderless
        />
        <SettingsItemTextValue
          icon={<Lock width={24} height={24} color={colors.black} />}
          title={t('securityPrivacy')}
          testID="SettingsMenu/Security"
          showChevron
          borderless
        />
        {walletConnectEnabled && (
          <SettingsItemTextValue
            icon={<Stack size={24} color={colors.black} />}
            title={t('connectedApplications')}
            testID="SettingsMenu/ConnectedDapps"
            value={connectedDapps.toString()}
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
        <View style={styles.border} />
        <SettingsItemTextValue
          title={t('legal')}
          testID="SettingsMenu/Legal"
          showChevron
          borderless
        />
        <View style={styles.appVersionContainer} testID="SettingsMenu/Version">
          <Text style={styles.appVersionText}>{t('appVersion')}</Text>
          <Text style={styles.appVersionText}>{appVersion}</Text>
        </View>
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
})
