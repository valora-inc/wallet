import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from '@react-navigation/drawer'
import {
  DrawerDescriptorMap,
  DrawerNavigationHelpers,
} from '@react-navigation/drawer/lib/typescript/src/types'
import {
  CommonActions,
  DrawerActions,
  DrawerNavigationState,
  ParamListBase,
  useLinkBuilder,
} from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import {
  backupCompletedSelector,
  cloudBackupCompletedSelector,
  defaultCountryCodeSelector,
  e164NumberSelector,
  nameSelector,
} from 'src/account/selectors'
import SettingsScreen from 'src/account/Settings'
import Support from 'src/account/Support'
import { HomeEvents, RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import AccountNumber from 'src/components/AccountNumber'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import PhoneNumberWithFlag from 'src/components/PhoneNumberWithFlag'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import { dappsListApiUrlSelector } from 'src/dapps/selectors'
import DAppsExplorerScreenSearchFilter from 'src/dappsExplorer/DAppsExplorerScreenSearchFilter'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import AttentionIcon from 'src/icons/Attention'
import { Home } from 'src/icons/Home'
import { AccountKey } from 'src/icons/navigator/AccountKey'
import { DappsExplorer } from 'src/icons/navigator/DappsExplorer'
import { Gold } from 'src/icons/navigator/Gold'
import { Help } from 'src/icons/navigator/Help'
import { Invite as InviteIcon } from 'src/icons/navigator/Invite'
import { Settings } from 'src/icons/navigator/Settings'
import Invite from 'src/invite/Invite'
import WalletSecurityPrimer from 'src/keylessBackup/WalletSecurityPrimer'
import DrawerItem from 'src/navigator/DrawerItem'
import { ensurePincode } from 'src/navigator/NavigationService'
import { getActiveRouteName } from 'src/navigator/NavigatorWrapper'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors, { Colors } from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { getSupportedNetworkIdsForTokenBalances } from 'src/tokens/utils'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'NavigationService'

const Drawer = createDrawerNavigator()

type CustomDrawerItemListProps = Omit<
  DrawerContentComponentProps,
  'contentContainerStyle' | 'style'
> & {
  state: DrawerNavigationState<ParamListBase>
  navigation: DrawerNavigationHelpers
  descriptors: DrawerDescriptorMap
  protectedRoutes: string[]
}

interface DrawerItemParams {
  onPress?: () => void
}

// This component has been taken from here:
// https://github.com/react-navigation/react-navigation/blob/1aadc79fb89177a2fff2dcd791d67a3c880009d0/packages/drawer/src/views/DrawerItemList.tsx
function CustomDrawerItemList({
  state,
  navigation,
  descriptors,
  protectedRoutes,
  ...passThroughProps
}: CustomDrawerItemListProps) {
  const buildLink = useLinkBuilder()

  return state.routes.map((route, i) => {
    const focused = i === state.index
    const { title, drawerLabel, drawerIcon } = descriptors[route.key].options
    const navigateToItem = () => {
      if (route.name === Screens.ConsumerIncentivesHomeScreen) {
        ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
          origin: RewardsScreenOrigin.SideMenu,
        })
      }
      ValoraAnalytics.track(HomeEvents.drawer_navigation, {
        navigateTo: route.name,
      })
      navigation.dispatch({
        ...(focused ? DrawerActions.closeDrawer() : CommonActions.navigate(route.name)),
        target: state.key,
      })
    }
    const onPress = () => {
      const activeRouteName = getActiveRouteName(navigation.getState())
      if (protectedRoutes.includes(route.name) && activeRouteName !== route.name) {
        // Route should be protected by PIN code
        ensurePincode()
          .then((pinIsCorrect) => {
            if (pinIsCorrect) {
              navigateToItem()
            }
          })
          .catch((error) => {
            Logger.error(`${TAG}@onPress`, 'PIN ensure error', error)
          })
      } else if (route.params && (route.params as DrawerItemParams).onPress) {
        const drawerParams = route.params as DrawerItemParams
        drawerParams.onPress?.()
      } else {
        navigateToItem()
      }
    }

    return (
      <DrawerItem
        {...passThroughProps}
        testID={`DrawerItem/${title}`}
        key={route.key}
        label={drawerLabel !== undefined ? drawerLabel : title !== undefined ? title : route.name}
        icon={drawerIcon}
        focused={focused}
        labelStyle={[
          fontStyles.regular,
          { color: colors.black, marginLeft: -20, fontWeight: 'normal' },
        ]}
        style={focused && { backgroundColor: colors.gray2 }}
        to={buildLink(route.name, route.params)}
        onPress={onPress}
      />
    )
  }) as React.ReactNode as React.ReactElement
}

function CustomDrawerContent(props: DrawerContentComponentProps) {
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
    <DrawerContentScrollView {...props}>
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
      <CustomDrawerItemList
        {...props}
        protectedRoutes={[Screens.BackupIntroduction, Screens.WalletSecurityPrimerDrawer]}
      />
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
    </DrawerContentScrollView>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.DrawerNavigator>

export default function DrawerNavigator({ route }: Props) {
  const { t } = useTranslation()
  const initialScreen = route.params?.initialScreen ?? Screens.WalletHome
  const dappsListUrl = useSelector(dappsListApiUrlSelector)

  const backupCompleted = useSelector(backupCompletedSelector)
  const cloudBackupCompleted = useSelector(cloudBackupCompletedSelector)

  const drawerContent = (props: DrawerContentComponentProps) => <CustomDrawerContent {...props} />

  const cloudBackupGate = getFeatureGate(StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_SETUP)
  const anyBackupCompleted = backupCompleted || cloudBackupCompleted
  const showWalletSecurity = !anyBackupCompleted && cloudBackupGate
  const showRecoveryPhrase = !anyBackupCompleted && !cloudBackupGate

  return (
    <Drawer.Navigator
      initialRouteName={initialScreen}
      drawerContent={drawerContent}
      backBehavior={'initialRoute'}
      screenOptions={{
        unmountOnBlur: true, // Reloads the screen when the user comes back to it - resetting navigation
        headerShown: false, // Hide the default header on v6
        drawerType: 'front', // Makes the drawer overlay the content
      }}
      // Whether inactive screens should be detached from the view hierarchy to save memory.
      // Defaults to true, but also explicitly set here.
      detachInactiveScreens={true}
    >
      <Drawer.Screen
        name={Screens.WalletHome}
        component={WalletHome}
        options={{
          title: t('home') ?? undefined,
          drawerIcon: Home,
          unmountOnBlur: false,
          freezeOnBlur: false,
        }}
      />
      <Drawer.Screen
        name={Screens.ExchangeHomeScreen}
        component={ExchangeHomeScreen}
        options={{ title: t('celoGold') ?? undefined, drawerIcon: Gold }}
      />

      {!!dappsListUrl && (
        <Drawer.Screen
          name={Screens.DAppsExplorerScreen}
          component={DAppsExplorerScreenSearchFilter}
          options={{
            title: t('dappsScreen.title') ?? undefined,
            drawerIcon: DappsExplorer,
            // Special case for the Dapps explorer,
            // so it reloads the list when the user comes back to it
            // Note: we generally want to avoid this as it resets the scroll position (and all other component state)
            // but here it's the right expectation
            unmountOnBlur: true,
          }}
        />
      )}

      {showWalletSecurity && (
        <Drawer.Screen
          // NOTE: this needs to be a different screen name from the screen
          // accessed from the settings which shows the back button instead of
          // the drawer. Otherwise the settings item will navigate to the
          // screen with the drawer. This wasn't needed for the
          // BackupIntroduction screen because it navigates to the pin screen
          // first.
          name={Screens.WalletSecurityPrimerDrawer}
          // @ts-expect-error component type in native-stack v6
          component={WalletSecurityPrimer}
          options={{
            drawerLabel: () => (
              <View style={styles.itemStyle}>
                <Text style={styles.itemTitle}>{t('walletSecurity')}</Text>
                <View style={styles.drawerItemIcon}>
                  <AttentionIcon color={Colors.primary} size={20} />
                </View>
              </View>
            ),
            title: t('walletSecurity') ?? undefined,
            drawerIcon: AccountKey,
          }}
          initialParams={{ showDrawerTopBar: true }}
        />
      )}
      {showRecoveryPhrase && (
        <Drawer.Screen
          name={Screens.BackupIntroduction}
          component={BackupIntroduction}
          options={{
            drawerLabel: () => (
              <View style={styles.itemStyle}>
                <Text style={styles.itemTitle}>{t('accountKey')}</Text>
                <View style={styles.drawerItemIcon}>
                  <AttentionIcon color={Colors.primary} size={20} />
                </View>
              </View>
            ),
            title: t('accountKey') ?? undefined,
            drawerIcon: AccountKey,
          }}
          initialParams={{ showDrawerTopBar: true }}
        />
      )}
      <Drawer.Screen
        name={Screens.InviteDrawer}
        component={Invite}
        options={{
          title: t('invite') ?? undefined,
          drawerIcon: () => <InviteIcon color="#B4B9BD" />,
        }}
      />
      <Drawer.Screen
        name={Screens.SettingsDrawer}
        component={SettingsScreen}
        options={{
          title: t('settings') ?? undefined,
          drawerIcon: () => <Settings color="#B4B9BD" />,
        }}
      />
      <Drawer.Screen
        name={Screens.SupportDrawer}
        component={Support}
        options={{ title: t('help') ?? undefined, drawerIcon: () => <Help color="#B4B9BD" /> }}
      />
    </Drawer.Navigator>
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
