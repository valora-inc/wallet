import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { useSelector } from 'react-redux'
import { defaultCountryCodeSelector, e164NumberSelector, nameSelector } from 'src/account/selectors'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import AccountNumber from 'src/components/AccountNumber'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import PhoneNumberWithFlag from 'src/components/PhoneNumberWithFlag'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
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
    <ScrollView>
      <View style={styles.drawerTop}>
        <View style={styles.drawerHeader} testID="Drawer/Header">
          <ContactCircleSelf size={64} />
          <RewardsPill />
        </View>
        {!!displayName && (
          <Text style={styles.nameLabel} testID="Drawer/Username">
            {displayName}
          </Text>
        )}
        {phoneNumberVerified && e164PhoneNumber && (
          <PhoneNumberWithFlag
            e164PhoneNumber={e164PhoneNumber}
            defaultCountryCode={defaultCountryCode ? defaultCountryCode : undefined}
          />
        )}
        <View style={styles.border} />
      </View>
      {/* Invite, settings, help go here */}
      <View style={styles.drawerBottom}>
        <Text style={fontStyles.label}>{t('address')}</Text>
        <AccountNumber address={account || ''} location={Screens.DrawerNavigator} />
        <Text style={styles.supportedNetworks}>
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
        <Text style={styles.smallLabel}>{t('version', { appVersion })}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  drawerTop: {
    marginLeft: 16,
    marginTop: 16,
    alignItems: 'flex-start',
    marginRight: 16,
  },
  drawerHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.Smallest8,
  },
  nameLabel: {
    ...fontStyles.displayName,
    marginBottom: Spacing.Smallest8,
  },
  border: {
    marginTop: 20,
    marginBottom: 12,
    height: 1,
    backgroundColor: colors.gray2,
    alignSelf: 'stretch',
  },
  drawerBottom: {
    marginVertical: 32,
    marginHorizontal: 16,
    gap: Spacing.Smallest8,
  },
  smallLabel: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 24,
  },
  supportedNetworks: {
    ...typeScale.bodyXSmall,
    color: colors.gray3,
  },
  itemStyle: {
    marginLeft: -20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerItemIcon: {
    paddingLeft: 10,
  },
  itemTitle: {
    ...fontStyles.regular,
  },
})
