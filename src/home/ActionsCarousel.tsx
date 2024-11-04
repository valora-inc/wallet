import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { ENABLED_QUICK_ACTIONS } from 'src/config'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { HomeActionName } from 'src/home/types'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsReceive from 'src/icons/quick-actions/Receive'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import QuickActionsWithdraw from 'src/icons/quick-actions/Withdraw'
import SwapArrows from 'src/icons/SwapArrows'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Actions = Record<
  HomeActionName,
  { title: string; icon: React.ReactNode; onPress: () => void; hidden?: boolean }
>

function ActionsCarousel() {
  const { t } = useTranslation()

  const shouldShowSwapAction = useSelector(isAppSwapsEnabledSelector)

  const actions: Actions = {
    [HomeActionName.Send]: {
      title: t('homeActions.send'),
      icon: <QuickActionsSend color={Colors.black} />,
      onPress: () => {
        navigate(Screens.SendSelectRecipient)
      },
    },
    [HomeActionName.Receive]: {
      title: t('homeActions.receive'),
      icon: <QuickActionsReceive color={Colors.black} />,
      onPress: () => {
        navigate(Screens.QRNavigator, {
          screen: Screens.QRCode,
        })
      },
    },
    [HomeActionName.Add]: {
      title: t('homeActions.add'),
      icon: <QuickActionsAdd color={Colors.black} />,
      onPress: () => {
        navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
      },
    },
    [HomeActionName.Swap]: {
      title: t('homeActions.swap'),
      icon: <SwapArrows color={Colors.black} />,
      onPress: () => {
        navigate(Screens.SwapScreenWithBack)
      },
      hidden: !shouldShowSwapAction,
    },
    [HomeActionName.Withdraw]: {
      title: t('homeActions.withdraw'),
      icon: <QuickActionsWithdraw color={Colors.black} />,
      onPress: () => {
        navigate(Screens.WithdrawSpend)
      },
    },
  }

  if (!ENABLED_QUICK_ACTIONS.length) {
    return null
  }

  return (
    <View style={styles.viewContainer}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
        testID={'HomeActionsCarousel'}
      >
        {ENABLED_QUICK_ACTIONS.map((name) => ({ ...actions[name], name }))
          .filter(({ hidden }) => !hidden)
          .map(({ name, title, icon, onPress }) => (
            <Card
              style={styles.card}
              shadow={null}
              key={`HomeAction-${name}`}
              testID={`HomeAction-${name}`}
            >
              <Touchable
                onPress={() => {
                  AppAnalytics.track(HomeEvents.home_action_pressed, { action: name })
                  onPress()
                }}
                style={styles.touchable}
                borderRadius={8}
                testID={`HomeActionTouchable-${name}`}
              >
                <>
                  {icon}
                  <Text
                    numberOfLines={1}
                    allowFontScaling={false}
                    style={styles.name}
                    testID={`HomeAction/Title-${name}`}
                  >
                    {title}
                  </Text>
                </>
              </Touchable>
            </Card>
          ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  viewContainer: {
    backgroundColor: Colors.white,
  },
  carouselContainer: {
    padding: Spacing.Regular16,
    gap: Spacing.Regular16,
  },
  card: {
    width: 84,
    padding: 0,
    backgroundColor: Colors.gray1,
    borderRadius: 10,
  },
  touchable: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  name: {
    ...typeScale.labelSmall,
    lineHeight: 17,
    paddingTop: Spacing.Smallest8,
    color: Colors.black,
  },
})

export default ActionsCarousel
