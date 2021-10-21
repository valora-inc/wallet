import Colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import ProgressArrow from 'src/icons/ProgressArrow'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { tokenBalancesSelector, totalTokenBalanceSelector } from 'src/tokens/reducer'

function HomeTokenBalance() {
  const { t } = useTranslation(Namespaces.walletFlow5)
  const tokenBalances = useSelector(tokenBalancesSelector)
  const totalBalance = useSelector(totalTokenBalanceSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const balances = Object.values(tokenBalances).filter((token) =>
    token?.balance ? new BigNumber(token?.balance).gt(0) : false
  )
  const multipleBalances: boolean = balances.length > 1
  const noBalances: boolean = balances.length == 0

  const onViewBalances = () => {
    ValoraAnalytics.track(HomeEvents.viewTokenBalances)
    navigate(Screens.TokenBalances)
  }

  return (
    <View style={styles.container}>
      <View style={styles.title}>
        <View style={styles.row}>
          <Text style={styles.totalValue}>{t('totalValue')}</Text>
          {!noBalances && <InfoIcon size={14} color={Colors.gray3} />}
        </View>
        {multipleBalances && (
          <TouchableOpacity style={styles.row} onPress={onViewBalances}>
            <Text style={styles.viewBalances}>{t('viewBalances')}</Text>
            <ProgressArrow style={styles.arrow} color={Colors.greenUI} />
          </TouchableOpacity>
        )}
      </View>
      {multipleBalances ? (
        <Text style={styles.balance}>
          {localCurrencySymbol}
          {totalBalance}
        </Text>
      ) : balances[0] && balances[0].balance ? (
        <View style={styles.oneBalance}>
          <Image source={{ uri: balances[0].imageUrl }} style={styles.tokenImg} />
          <View style={styles.column}>
            <Text style={styles.balance}>
              {localCurrencySymbol}
              {totalBalance}
            </Text>
            <Text style={styles.tokenBalance}>
              {new BigNumber(balances[0].balance).toFixed(2)} {balances[0].name}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.balance}>
          {localCurrencySymbol}
          {'0.00'}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    margin: variables.contentPadding,
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 7,
  },
  row: {
    flexDirection: 'row',
  },
  totalValue: {
    ...fontStyles.sectionHeader,
    color: Colors.gray4,
    paddingRight: 5,
  },
  viewBalances: {
    ...fontStyles.label,
    color: Colors.greenUI,
    paddingRight: 8,
  },
  arrow: {
    paddingTop: 3,
  },
  balance: {
    ...fontStyles.largeNumber,
  },
  oneBalance: {
    flexDirection: 'row',
  },
  tokenImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 8,
  },
  column: {
    flexDirection: 'column',
  },
  tokenBalance: {
    ...fontStyles.label,
    color: Colors.gray4,
  },
})

export default HomeTokenBalance
