import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { AppState } from 'src/app/actions'
import ListItem from 'src/components/ListItem'
import { FiatExchangeTokenBalance } from 'src/components/TokenBalance'
import { FUNDING_LINK } from 'src/config'
import { features } from 'src/flags'
import { fiatExchange } from 'src/images/Images'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useTypedSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

function FiatExchange() {
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const appState = useTypedSelector((state) => state.app.appState)

  useEffect(() => {
    if (appState === AppState.Active && timestamp) {
      const timeElapsed: number = Date.now() - timestamp
      Logger.debug('Time Elapsed', String(timeElapsed))
      ValoraAnalytics.track(FiatExchangeEvents.cico_fund_info_return, {
        timeElapsed,
      })
      setTimestamp(null)
    }
  }, [appState])

  function goToAddFunds() {
    navigate(Screens.FiatExchangeOptions, {
      isCashIn: true,
    })
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_selected)
  }

  function goToCashOut() {
    navigate(Screens.FiatExchangeOptions, { isCashIn: false })
    ValoraAnalytics.track(FiatExchangeEvents.cico_cash_out_selected)
  }

  function goToSpend() {
    navigate(Screens.Spend)
    ValoraAnalytics.track(FiatExchangeEvents.cico_spend_selected)
  }

  const { t } = useTranslation()

  const { FIAT_SPEND_ENABLED } = useCountryFeatures()

  const onOpenOtherFundingOptions = () => {
    navigateToURI(FUNDING_LINK)
    ValoraAnalytics.track(FiatExchangeEvents.cico_fund_info)
    setTimestamp(Date.now())
  }

  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <FiatExchangeTokenBalance key={'FiatExchangeTokenBalance'} />
          <Image source={fiatExchange} style={styles.image} resizeMode={'contain'} />
        </View>
        <View style={styles.optionsListContainer}>
          <ListItem onPress={goToAddFunds}>
            <Text testID="addFunds" style={styles.optionTitle}>
              {t('addFunds')}
            </Text>
            <Text style={styles.optionSubtitle}>{t('addFundsSubtitle')}</Text>
          </ListItem>
          {features.SHOW_CASH_OUT ? (
            <ListItem onPress={goToCashOut}>
              <Text testID="cashOut" style={styles.optionTitle}>
                {t('cashOut')}
              </Text>
              <Text style={styles.optionSubtitle}>{t('cashOutSubtitle')}</Text>
            </ListItem>
          ) : (
            <ListItem>
              <Text style={styles.optionTitleComingSoon}>{t('cashOutComingSoon')}</Text>
            </ListItem>
          )}
          {FIAT_SPEND_ENABLED && (
            <ListItem onPress={goToSpend}>
              <Text style={styles.optionTitle}>{t('spend')}</Text>
              <Text style={styles.optionSubtitle}>{t('spendSubtitle')}</Text>
            </ListItem>
          )}
        </View>
        <View style={styles.moreWaysContainer}>
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
    paddingRight: variables.contentPadding,
  },
  optionTitle: {
    ...fontStyles.regular500,
  },
  optionSubtitle: {
    marginTop: 2,
    ...fontStyles.small,
    color: colors.gray4,
  },
  optionTitleComingSoon: {
    ...fontStyles.regular,
    color: colors.gray3,
  },
  moreWaysContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  moreWays: {
    ...fontStyles.regular,
    color: colors.gray5,
    margin: variables.contentPadding,
  },
  fundingOptionsLink: {
    textDecorationLine: 'underline',
  },
})

export default FiatExchange
