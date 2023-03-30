import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { QuickActionName } from 'src/home/types'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsReceive from 'src/icons/quick-actions/Receive'
import QuickActionsRequest from 'src/icons/quick-actions/Request'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import QuickActionsSwap from 'src/icons/quick-actions/Swap'
import QuickActionsWithdraw from 'src/icons/quick-actions/Withdraw'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

function QuickActions() {
  const { t } = useTranslation()

  const actions = [
    {
      name: QuickActionName.Send,
      title: t('send'),
      icon: <QuickActionsSend />,
      onPress: () => {
        navigate(Screens.Send)
      },
    },
    {
      name: QuickActionName.Receive,
      title: t('quickActions.receive'),
      icon: <QuickActionsReceive />,
      onPress: () => {
        navigate(Screens.QRNavigator)
      },
    },
    {
      name: QuickActionName.Add,
      title: t('quickActions.add'),
      icon: <QuickActionsAdd />,
      onPress: () => {
        navigate(Screens.FiatExchangeCurrency, {
          flow: FiatExchangeFlow.CashIn,
        })
      },
    },
    {
      name: QuickActionName.Swap,
      title: t('quickActions.swap'),
      icon: <QuickActionsSwap />,
      onPress: () => {
        navigate(Screens.SwapScreen)
      },
    },
    {
      name: QuickActionName.Request,
      title: t('request'),
      icon: <QuickActionsRequest />,
      onPress: () => {
        navigate(Screens.Send, { isOutgoingPaymentRequest: true })
      },
    },
    {
      name: QuickActionName.Withdraw,
      title: t('withdraw'),
      icon: <QuickActionsWithdraw />,
      onPress: () => {
        navigate(Screens.FiatExchange)
      },
    },
  ]

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContainer}
      testID={'QuickActionsContainer'}
    >
      {actions.map(({ name, title, icon, onPress }, index) => (
        <Card style={styles.card} shadow={null} key={`QuickAction-${name}`}>
          <Touchable onPress={onPress} style={styles.touchable} testID={`QuickAction-${name}`}>
            <>
              {icon}
              <Text style={styles.name} testID={`QuickAction/Title-${name}`}>
                {title}
              </Text>
            </>
          </Touchable>
        </Card>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  carouselContainer: {
    paddingHorizontal: 10,
  },
  card: {
    width: 84,
    height: 91,
    marginHorizontal: 6,
    padding: 0,
    backgroundColor: '#E8FCEF',
    borderRadius: 10,
  },
  touchable: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  name: {
    ...fontStyles.small500,
    lineHeight: 17,
    paddingTop: 10,
    color: Colors.onboardingGreen,
  },
})

export default QuickActions
