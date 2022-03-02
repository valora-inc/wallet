import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
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
import { TransitionPresets } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { useDispatch } from 'react-redux'
import FiatExchange from 'src/account/FiatExchange'
import GoldEducation from 'src/account/GoldEducation'
import { defaultCountryCodeSelector, e164NumberSelector, nameSelector } from 'src/account/selectors'
import SettingsScreen from 'src/account/Settings'
import Support from 'src/account/Support'
import { HomeEvents, RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { toggleInviteModal } from 'src/app/actions'
import {
  dappsListApiUrlSelector,
  multiTokenShowHomeBalancesSelector,
  rewardsEnabledSelector,
  superchargeButtonTypeSelector,
} from 'src/app/selectors'
import { SuperchargeButtonType } from 'src/app/types'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import AccountNumber from 'src/components/AccountNumber'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import DAppsExplorerScreen from 'src/dappsExplorer/DAppsExplorerScreen'
import { fetchExchangeRate } from 'src/exchange/actions'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import { features } from 'src/flags'
import WalletHome from 'src/home/WalletHome'
import { AccountKey } from 'src/icons/navigator/AccountKey'
import { AddWithdraw } from 'src/icons/navigator/AddWithdraw'
import { DappsExplorer } from 'src/icons/navigator/DappsExplorer'
import { Gold } from 'src/icons/navigator/Gold'
import { Help } from 'src/icons/navigator/Help'
import { Home } from 'src/icons/navigator/Home'
import { Invite } from 'src/icons/navigator/Invite'
import MenuRings from 'src/icons/navigator/MenuRings'
import MenuSupercharge from 'src/icons/navigator/MenuSupercharge'
import { Settings } from 'src/icons/navigator/Settings'
import InviteFriendModal from 'src/invite/InviteFriendModal'
import BalancesDisplay from 'src/navigator/BalancesDisplay'
import DrawerItem from 'src/navigator/DrawerItem'
import { ensurePincode } from 'src/navigator/NavigationService'
import { getActiveRouteName } from 'src/navigator/NavigatorWrapper'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { default as useSelector } from 'src/redux/useSelector'
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
      const activeRouteName = getActiveRouteName(navigation.dangerouslyGetState())
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
  const showBalances = !useSelector(multiTokenShowHomeBalancesSelector)

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
          <RewardsPill />
        </View>
        <Text style={styles.nameLabel}>{displayName}</Text>
        {e164PhoneNumber && (
          <PhoneNumberWithFlag
            e164PhoneNumber={e164PhoneNumber}
            defaultCountryCode={defaultCountryCode ? defaultCountryCode : undefined}
          />
        )}
        <View style={styles.border} />
        {showBalances && <BalancesDisplay />}
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
      initialRouteName={Screens.WalletHome}
      drawerContent={drawerContent}
      backBehavior={'initialRoute'}
      drawerContentOptions={{
        labelStyle: [fontStyles.regular, { marginLeft: -20, fontWeight: 'normal' }],
        activeBackgroundColor: colors.gray2,
      }}
    >
      <Drawer.Screen
        name={Screens.WalletHome}
        component={WalletHome}
        options={{ title: t('home'), drawerIcon: Home }}
      />
      {(isCeloEducationComplete && (
        <Drawer.Screen
          name={Screens.ExchangeHomeScreen}
          component={ExchangeHomeScreen}
          options={{ title: t('celoGold'), drawerIcon: Gold }}
        />
      )) || (
        <Drawer.Screen
          name={Screens.GoldEducation}
          component={GoldEducation}
          options={{
            title: t('celoGold'),
            drawerIcon: Gold,
            ...TransitionPresets.ModalTransition,
          }}
        />
      )}
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
      <Drawer.Screen
        name={Screens.FiatExchange}
        component={FiatExchange}
        options={{ title: t('addAndWithdraw'), drawerIcon: AddWithdraw }}
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
