import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import { AppState } from 'src/app/actions'
import ListItem from 'src/components/ListItem'
import { FiatExchangeTokenBalance } from 'src/components/TokenBalance'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { fiatExchange } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { navigateToURI } from 'src/utils/linking'

export default function WithdrawSpend() {
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const appState = useSelector((state) => state.app.appState)

  const { links } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG])

  useEffect(() => {
    if (appState === AppState.Active && timestamp) {
      const timeElapsed: number = Date.now() - timestamp
      Logger.debug('Time Elapsed', String(timeElapsed))
      setTimestamp(null)
    }
  }, [appState])

  function goToCashOut() {
    navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashOut })
    AppAnalytics.track(FiatExchangeEvents.cico_landing_select_flow, {
      flow: FiatExchangeFlow.CashOut,
    })
  }

  function goToSpend() {
    navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.Spend })
    AppAnalytics.track(FiatExchangeEvents.cico_landing_select_flow, {
      flow: FiatExchangeFlow.Spend,
    })
  }

  const { t } = useTranslation()

  const onOpenOtherFundingOptions = () => {
    navigateToURI(links.funding)
    AppAnalytics.track(FiatExchangeEvents.cico_landing_how_to_fund)
    setTimestamp(Date.now())
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView testID="FiatExchange/scrollView" contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <FiatExchangeTokenBalance key={'FiatExchangeTokenBalance'} />
          <Image source={fiatExchange} style={styles.image} resizeMode={'contain'} />
        </View>
        <View style={styles.optionsListContainer}>
          <ListItem onPress={goToSpend}>
            <Text testID="spend" style={styles.optionTitle}>
              {t(`fiatExchangeFlow.spend.fiatExchangeTitle`)}
            </Text>
            <Text style={styles.optionSubtitle}>
              {t(`fiatExchangeFlow.spend.fiatExchangeSubtitle`)}
            </Text>
          </ListItem>
          <ListItem onPress={goToCashOut}>
            <Text testID="cashOut" style={styles.optionTitle}>
              {t(`fiatExchangeFlow.cashOut.fiatExchangeTitle`)}
            </Text>
            <Text style={styles.optionSubtitle}>
              {t(`fiatExchangeFlow.cashOut.fiatExchangeSubtitle`)}
            </Text>
          </ListItem>
        </View>
        <View testID="otherFundingOptions" style={styles.moreWaysContainer}>
          <Text style={styles.moreWays}>
            <Trans i18nKey="otherFundingOptions">
              <Text onPress={onOpenOtherFundingOptions} style={styles.fundingOptionsLink} />
            </Trans>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap-reverse',
  },
  contentContainer: {
    justifyContent: 'space-between',
    flexDirection: 'column',
    flexGrow: 1,
  },
  image: {
    marginHorizontal: variables.contentPadding,
  },
  optionsListContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  optionTitle: {
    ...typeScale.labelMedium,
  },
  optionSubtitle: {
    marginTop: 2,
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
  moreWaysContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  moreWays: {
    ...typeScale.bodyMedium,
    color: colors.gray5,
    margin: variables.contentPadding,
  },
  fundingOptionsLink: {
    textDecorationLine: 'underline',
  },
})
