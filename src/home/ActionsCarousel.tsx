import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { HomeActionName } from 'src/home/types'
import HomeActionsAdd from 'src/icons/home-actions/Add'
import HomeActionsReceive from 'src/icons/home-actions/Receive'
import HomeActionsRequest from 'src/icons/home-actions/Request'
import HomeActionsSend from 'src/icons/home-actions/Send'
import HomeActionsSwap from 'src/icons/home-actions/Swap'
import HomeActionsWithdraw from 'src/icons/home-actions/Withdraw'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

function ActionsCarousel() {
  const { t } = useTranslation()

  const actions = [
    {
      name: HomeActionName.Send,
      title: t('homeActions.send'),
      icon: <HomeActionsSend />,
      onPress: () => {
        navigate(Screens.Send)
      },
    },
    {
      name: HomeActionName.Receive,
      title: t('homeActions.receive'),
      icon: <HomeActionsReceive />,
      onPress: () => {
        navigate(Screens.QRNavigator)
      },
    },
    {
      name: HomeActionName.Add,
      title: t('homeActions.add'),
      icon: <HomeActionsAdd />,
      onPress: () => {
        navigate(Screens.FiatExchangeCurrency, {
          flow: FiatExchangeFlow.CashIn,
        })
      },
    },
    {
      name: HomeActionName.Swap,
      title: t('homeActions.swap'),
      icon: <HomeActionsSwap />,
      onPress: () => {
        navigate(Screens.SwapScreen)
      },
    },
    {
      name: HomeActionName.Request,
      title: t('homeActions.request'),
      icon: <HomeActionsRequest />,
      onPress: () => {
        navigate(Screens.Send, { isOutgoingPaymentRequest: true })
      },
    },
    {
      name: HomeActionName.Withdraw,
      title: t('homeActions.withdraw'),
      icon: <HomeActionsWithdraw />,
      onPress: () => {
        navigate(Screens.WithdrawSpend)
      },
    },
  ]

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carouselContainer}
      testID={'HomeActionsCarousel'}
    >
      {actions.map(({ name, title, icon, onPress }) => (
        <Card style={styles.card} shadow={null} key={`HomeAction-${name}`}>
          <Touchable onPress={onPress} style={styles.touchable} testID={`HomeAction-${name}`}>
            <>
              {icon}
              <Text style={styles.name} testID={`HomeAction/Title-${name}`}>
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

export default ActionsCarousel
