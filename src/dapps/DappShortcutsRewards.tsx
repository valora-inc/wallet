import { BigNumber } from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Button, { BtnSizes } from 'src/components/Button'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import {
  getLocalCurrencySymbol,
  localCurrencyExchangeRatesSelector,
} from 'src/localCurrency/selectors'
import { positionsWithClaimableRewardsSelector } from 'src/positions/selectors'
import { ClaimablePosition } from 'src/positions/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Currency } from 'src/utils/currencies'

function DappShortcutsRewards() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyExchangeRate = useSelector(localCurrencyExchangeRatesSelector)
  const positionsWithClaimableRewards = useSelector(positionsWithClaimableRewardsSelector)

  const handleClaimReward = (position: ClaimablePosition) => () => {
    // do something
  }

  const renderItem = ({ item }: { item: ClaimablePosition }) => {
    let claimableFiatValue = new BigNumber(0)
    item.claimableShortcut.claimableTokens.forEach((token) => {
      claimableFiatValue = claimableFiatValue.plus(
        BigNumber(token.priceUsd).times(BigNumber(token.balance))
      )
    })
    const claimableValueLocalCurrency = convertDollarsToLocalAmount(
      claimableFiatValue,
      localCurrencyExchangeRate[Currency.Dollar]
    )

    return (
      <View style={styles.card} testID="DappShortcutsRewards/Card">
        <View style={styles.rewardInfoContainer}>
          <View style={styles.rewardAmountContainer}>
            <Text style={styles.rewardLabel}>
              {t('dappShortcuts.claimRewardsScreen.rewardLabel')}
            </Text>

            <Text style={styles.rewardAmount}>
              {item.claimableShortcut.claimableTokens
                .map((token) => `${new BigNumber(token.balance).toFixed(5)} ${token.symbol}`)
                .join(', ')}
            </Text>
            {claimableValueLocalCurrency && (
              <Text style={styles.rewardFiatAmount}>
                {`${localCurrencySymbol} ${claimableValueLocalCurrency.toFixed(
                  claimableValueLocalCurrency.lt(0.01) ? 5 : 2
                )}`}
              </Text>
            )}
          </View>
          <Button
            onPress={handleClaimReward(item)}
            text={t('dappShortcuts.claimRewardsScreen.claimButton')}
            size={BtnSizes.SMALL}
            touchableStyle={styles.claimButton}
            testID="DappShortcutsRewards/ClaimButton"
          />
        </View>
        <View style={styles.dappInfoContainer}>
          <Image source={{ uri: item.displayProps.imageUrl }} style={styles.dappLogo} />
          <Text style={styles.dappName}>{item.appName}</Text>
        </View>
      </View>
    )
  }

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>{t('dappShortcuts.claimRewardsScreen.title')}</Text>
        <Text style={styles.subHeading}>{t('dappShortcuts.claimRewardsScreen.description')}</Text>
      </View>
    )
  }

  return (
    <>
      <Animated.FlatList
        contentContainerStyle={{
          paddingHorizontal: Spacing.Thick24,
          paddingBottom: insets.bottom,
        }}
        scrollEventThrottle={16}
        renderItem={renderItem}
        data={positionsWithClaimableRewards}
        ListHeaderComponent={renderHeader}
      />
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 12,
  },
  rewardInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Small12,
  },
  rewardAmountContainer: {
    flex: 1,
    marginRight: Spacing.Small12,
  },
  rewardLabel: {
    ...fontStyles.xsmall,
    color: Colors.gray3,
  },
  rewardAmount: {
    ...fontStyles.large600,
    lineHeight: 28,
    flexWrap: 'wrap',
  },
  rewardFiatAmount: {
    ...fontStyles.small,
  },
  dappInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Small12,
    backgroundColor: Colors.gray1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dappLogo: {
    width: 18,
    height: 18,
    marginRight: Spacing.Smallest8,
    backgroundColor: Colors.light,
    borderRadius: 100,
  },
  dappName: {
    ...fontStyles.small600,
  },
  headerContainer: {
    paddingTop: Spacing.Smallest8,
    paddingBottom: Spacing.Thick24,
  },
  heading: {
    ...fontStyles.large600,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: Spacing.Tiny4,
  },
  subHeading: {
    ...fontStyles.small,
    color: Colors.gray3,
  },
  claimButton: {
    minWidth: 72,
  },
})

export default DappShortcutsRewards
