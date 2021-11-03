import Colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Dialog from 'src/components/Dialog'
import { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import ProgressArrow from 'src/icons/ProgressArrow'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { tokensWithBalanceSelector, totalTokenBalanceSelector } from 'src/tokens/selectors'

function TokenBalance() {
  const tokenBalances = useSelector(tokensWithBalanceSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalBalance = useSelector(totalTokenBalanceSelector)
  if (tokenBalances.length === 0) {
    return (
      <Text style={styles.balance} testID={'TotalTokenBalance'}>
        {localCurrencySymbol}
        {'0.00'}
      </Text>
    )
  } else if (tokenBalances.length === 1) {
    console.log('ONE')
    console.log(totalBalance)
    return (
      <View style={styles.oneBalance}>
        <Image source={{ uri: tokenBalances[0].imageUrl }} style={styles.tokenImg} />
        <View style={styles.column}>
          <Text style={styles.balance} testID={'TotalTokenBalance'}>
            {localCurrencySymbol}
            {totalBalance}
          </Text>
          <Text style={styles.tokenBalance}>
            {new BigNumber(tokenBalances[0].balance).toFixed(2)} {tokenBalances[0].name}
          </Text>
        </View>
      </View>
    )
  } else {
    return (
      <Text style={styles.balance} testID={'TotalTokenBalance'}>
        {localCurrencySymbol}
        {totalBalance}
      </Text>
    )
  }
}

function HomeTokenBalance() {
  const { t } = useTranslation(Namespaces.walletFlow5)
  const totalBalance = useSelector(totalTokenBalanceSelector) ?? '-'
  const tokenBalances = useSelector(tokensWithBalanceSelector)

  const onViewBalances = () => {
    ValoraAnalytics.track(HomeEvents.viewTokenBalances, totalBalance)
    navigate(Screens.TokenBalances)
  }

  const [infoVisible, setInfoVisible] = useState(false)

  return (
    <View style={styles.container}>
      <View style={styles.title}>
        <View style={styles.row}>
          <Text style={styles.totalValue}>{t('totalValue')}</Text>
          {tokenBalances.length > 0 && (
            <TouchableOpacity onPress={() => setInfoVisible(true)} hitSlop={variables.iconHitslop}>
              <InfoIcon size={14} color={Colors.gray3} />
            </TouchableOpacity>
          )}
        </View>
        <Dialog
          title={t('whatTotalValue.title')}
          isVisible={infoVisible}
          actionText={t('whatTotalValue.dismiss')}
          actionPress={() => setInfoVisible(false)}
        >
          {t('whatTotalValue.body')}
        </Dialog>
        {tokenBalances.length > 1 && (
          <TouchableOpacity style={styles.row} onPress={onViewBalances}>
            <Text style={styles.viewBalances}>{t('viewBalances')}</Text>
            <ProgressArrow style={styles.arrow} color={Colors.greenUI} />
          </TouchableOpacity>
        )}
      </View>
      <TokenBalance />
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
