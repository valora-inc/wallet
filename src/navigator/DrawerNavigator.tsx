import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentOptions,
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
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { useDispatch } from 'react-redux'
import { defaultCountryCodeSelector, e164NumberSelector, nameSelector } from 'src/account/selectors'
import SettingsScreen from 'src/account/Settings'
import Support from 'src/account/Support'
import { HomeEvents, RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { toggleInviteModal } from 'src/app/actions'
import {
  dappsListApiUrlSelector,
  rewardsEnabledSelector,
  superchargeButtonTypeSelector,
} from 'src/app/selectors'
import { SuperchargeButtonType } from 'src/app/types'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import AccountNumber from 'src/components/AccountNumber'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import PhoneNumberWithFlag from 'src/components/PhoneNumberWithFlag'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import DAppsExplorerScreen from 'src/dappsExplorer/DAppsExplorerScreen'
import { fetchExchangeRate } from 'src/exchange/actions'
import { features } from 'src/flags'
import { AccountKey } from 'src/icons/navigator/AccountKey'
import { DappsExplorer } from 'src/icons/navigator/DappsExplorer'
import { Help } from 'src/icons/navigator/Help'
import { Invite } from 'src/icons/navigator/Invite'
import { MenuRings } from 'src/icons/navigator/MenuRings'
import { MenuSupercharge } from 'src/icons/navigator/MenuSupercharge'
import { Settings } from 'src/icons/navigator/Settings'
import Wallet from 'src/icons/navigator/Wallet'
import InviteFriendModal from 'src/invite/InviteFriendModal'
import DrawerItem from 'src/navigator/DrawerItem'
import { ensurePincode } from 'src/navigator/NavigationService'
import { getActiveRouteName } from 'src/navigator/NavigatorWrapper'
import { Screens } from 'src/navigator/Screens'
import TabNavigator from 'src/navigator/TabNavigator'
import { default as useSelector } from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'NavigationService'

const Drawer = createDrawerNavigator()

type CustomDrawerItemListProps = Omit<DrawerContentOptions, 'contentContainerStyle' | 'style'> & {
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
  itemStyle,
  protectedRoutes,
  ...passThroughProps
}: CustomDrawerItemListProps) {
  const buildLink = useLinkBuilder()

  return (state.routes.map((route, i) => {
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
        style={itemStyle}
        to={buildLink(route.name, route.params)}
        onPress={onPress}
      />
    )
  }) as React.ReactNode) as React.ReactElement
}

function CustomDrawerContent(props: DrawerContentComponentProps<DrawerContentOptions>) {
  const { t } = useTranslation()
  const displayName = useSelector(nameSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const account = useSelector(currentAccountSelector)
  const appVersion = deviceInfoModule.getVersion()

  const dispatch = useDispatch()
  useEffect(() => {
    // Needed for the local CELO balance display
    dispatch(fetchExchangeRate())
  }, [])

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerTop}>
        <View style={styles.drawerHeader}>
          <ContactCircleSelf size={64} />
        </View>
        <Text style={styles.nameLabel}>{displayName}</Text>
        {e164PhoneNumber && (
          <PhoneNumberWithFlag
            e164PhoneNumber={e164PhoneNumber}
            defaultCountryCode={defaultCountryCode ? defaultCountryCode : undefined}
          />
        )}
        <View style={styles.border} />
      </View>
      <CustomDrawerItemList {...props} protectedRoutes={[Screens.BackupIntroduction]} />
      <View style={styles.drawerBottom}>
        <Text style={fontStyles.label}>{t('address')}</Text>
        <AccountNumber address={account || ''} location={Screens.DrawerNavigator} />
        <Text style={styles.smallLabel}>{t('version', { appVersion })}</Text>
      </View>
    </DrawerContentScrollView>
  )
}

export default function DrawerNavigator() {
  const { t } = useTranslation()
  const isCeloEducationComplete = useSelector((state) => state.goldToken.educationCompleted)
  const dappsListUrl = useSelector(dappsListApiUrlSelector)

  const rewardsEnabled = useSelector(rewardsEnabledSelector)
  const superchargeButtonType = useSelector(superchargeButtonTypeSelector)
  const dispatch = useDispatch()

  const drawerContent = (props: DrawerContentComponentProps<DrawerContentOptions>) => (
    <CustomDrawerContent {...props} />
  )

  return (
    <Drawer.Navigator
      initialRouteName={Screens.TabNavigation}
      drawerContent={drawerContent}
      backBehavior={'initialRoute'}
      drawerContentOptions={{
        labelStyle: [fontStyles.regular, { marginLeft: -20, fontWeight: 'normal' }],
        activeBackgroundColor: colors.gray2,
      }}
    >
      <Drawer.Screen
        name={Screens.TabNavigation}
        component={TabNavigator}
        options={{ title: t('home'), drawerIcon: Wallet }}
      />
      {dappsListUrl && (
        <Drawer.Screen
          name={Screens.DAppsExplorerScreen}
          component={DAppsExplorerScreen}
          options={{
            title: t('dappsScreen.title'),
            drawerIcon: DappsExplorer,
            // Special case for the Dapps explorer,
            // so it reloads the list when the user comes back to it
            // Note: we generally want to avoid this as it resets the scroll position (and all other component state)
            // but here it's the right expectation
            unmountOnBlur: true,
          }}
        />
      )}
      {rewardsEnabled && superchargeButtonType === SuperchargeButtonType.MenuRewards && (
        <Drawer.Screen
          name={Screens.ConsumerIncentivesHomeScreen}
          component={ConsumerIncentivesHomeScreen}
          options={{ title: t('rewards'), drawerIcon: MenuRings, unmountOnBlur: true }}
        />
      )}
      {rewardsEnabled && superchargeButtonType === SuperchargeButtonType.MenuSupercharge && (
        <Drawer.Screen
          name={Screens.ConsumerIncentivesHomeScreen}
          component={ConsumerIncentivesHomeScreen}
          options={{ title: t('supercharge'), drawerIcon: MenuSupercharge, unmountOnBlur: true }}
        />
      )}
      <Drawer.Screen
        name={Screens.BackupIntroduction}
        component={BackupIntroduction}
        options={{ title: t('accountKey'), drawerIcon: AccountKey }}
      />
      {features.SHOW_INVITE_MENU_ITEM && (
        <Drawer.Screen
          name={'InviteModal'}
          component={InviteFriendModal}
          initialParams={{
            onPress: () => dispatch(toggleInviteModal(true)),
          }}
          options={{ title: t('invite'), drawerIcon: Invite }}
        />
      )}
      <Drawer.Screen
        name={Screens.Settings}
        component={SettingsScreen}
        options={{ title: t('settings'), drawerIcon: Settings }}
      />
      <Drawer.Screen
        name={Screens.Support}
        component={Support}
        options={{ title: t('help'), drawerIcon: Help }}
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
  },
  nameLabel: {
    ...fontStyles.displayName,
    marginTop: 8,
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
  },
  smallLabel: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 32,
  },
})
