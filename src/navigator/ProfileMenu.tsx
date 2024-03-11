import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { ScrollView } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'
import { defaultCountryCodeSelector, e164NumberSelector, nameSelector } from 'src/account/selectors'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import AccountNumber from 'src/components/AccountNumber'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import PhoneNumberWithFlag from 'src/components/PhoneNumberWithFlag'
import Touchable from 'src/components/Touchable'
import Help from 'src/icons/navigator/Help'
import { Invite } from 'src/icons/navigator/Invite'
import Settings from 'src/icons/navigator/Settings'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import colors, { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { getSupportedNetworkIdsForTokenBalances } from 'src/tokens/utils'
import { currentAccountSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.ProfileMenu>

export default function ProfileMenu({ route }: Props) {
  const { t } = useTranslation()
  const displayName = useSelector(nameSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const account = useSelector(currentAccountSelector)
  const appVersion = deviceInfoModule.getVersion()
  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const networks = getSupportedNetworkIdsForTokenBalances()
  const networkNames = networks.map((network) => NETWORK_NAMES[network])
  return (
    <SafeAreaView>
      <ScrollView>
        <View style={styles.top}>
          <ContactCircleSelf size={64} />
          <View style={styles.infoContainer}>
            {!!displayName && (
              <Text style={styles.nameLabel} testID="ProfileMenu/Username">
                {displayName}
              </Text>
            )}
            {phoneNumberVerified && e164PhoneNumber && (
              <PhoneNumberWithFlag
                e164PhoneNumber={e164PhoneNumber}
                defaultCountryCode={defaultCountryCode ? defaultCountryCode : undefined}
                textColor={Colors.gray4}
              />
            )}
          </View>
        </View>
        <View style={styles.topBorder} />
        <Touchable testID="ProfileMenu/Invite" onPress={() => navigate(Screens.Invite)}>
          <View style={styles.container}>
            <Invite color={Colors.gray3} />
            <Text style={styles.actionLabel}>{t('invite')}</Text>
          </View>
        </Touchable>
        <Touchable testID="ProfileMenu/Settings" onPress={() => navigate(Screens.Settings)}>
          <View style={styles.container}>
            <Settings color={Colors.gray3} />
            <Text style={styles.actionLabel}>{t('settings')}</Text>
          </View>
        </Touchable>
        <Touchable testID="ProfileMenu/Help" onPress={() => navigate(Screens.Support)}>
          <View style={styles.container}>
            <Help color={Colors.gray3} />
            <Text style={styles.actionLabel}>{t('help')}</Text>
          </View>
        </Touchable>
        <View style={styles.bottomBorder} />
        <View style={styles.bottom}>
          <Text style={typeScale.labelSemiBoldXSmall}>{t('address')}</Text>
          <AccountNumber address={account || ''} location={Screens.ProfileMenu} />
          <Text style={styles.supportedNetworks} testID="ProfileMenu/SupportedNetworks">
            {networks.length > 1
              ? t('supportedNetworks', {
                  networks: `${networkNames.slice(0, -1).join(', ')} ${t('and')} ${networkNames.at(
                    -1
                  )}`,
                })
              : t('supportedNetwork', {
                  network: networkNames[0],
                })}
          </Text>
          <Text style={styles.smallLabel} testID="ProfileMenu/Version">
            {t('version', { appVersion })}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

ProfileMenu.navigationOptions = () => ({
  ...headerWithCloseButton,
  headerRight: () => <RewardsPill />,
})

const styles = StyleSheet.create({
  top: {
    alignItems: 'flex-start',
    marginLeft: Spacing.Thick24,
    marginRight: Spacing.Regular16,
    marginTop: Spacing.Thick24,
  },
  nameLabel: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Smallest8,
  },
  infoContainer: {
    marginTop: Spacing.Smallest8,
  },
  topBorder: {
    marginVertical: Spacing.Thick24,
    marginLeft: Spacing.Thick24,
    height: 1,
    backgroundColor: colors.gray2,
    alignSelf: 'stretch',
  },
  bottomBorder: {
    marginTop: Spacing.Thick24,
    marginLeft: Spacing.Thick24,
    height: 1,
    backgroundColor: colors.gray2,
    alignSelf: 'stretch',
  },
  bottom: {
    marginVertical: Spacing.Large32,
    marginHorizontal: Spacing.Regular16,
    gap: Spacing.Smallest8,
  },
  smallLabel: {
    ...typeScale.bodySmall,
    color: colors.gray4,
    marginTop: Spacing.Thick24,
  },
  supportedNetworks: {
    ...typeScale.bodyXSmall,
    color: colors.gray3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.Smallest8,
    marginLeft: Spacing.Thick24,
    gap: Spacing.Small12,
  },
  actionLabel: {
    ...typeScale.bodyMedium,
  },
})
