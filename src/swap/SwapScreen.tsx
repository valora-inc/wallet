import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Button, { BtnSizes } from 'src/components/Button'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { Spacing } from 'src/styles/styles'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import { coreTokensSelector } from 'src/tokens/selectors'

const DEFAULT_TO_TOKEN = 'cUSD'
const DEFAULT_FROM_TOKEN = 'CELO'

export function SwapScreen() {
  const { t } = useTranslation()

  const coreTokens = useSelector(coreTokensSelector)

  const [exchangeRate, setExchangeRate] = useState<BigNumber | null>(new BigNumber(3))
  const [toToken, setToToken] = useState(
    coreTokens.find((token) => token.symbol === DEFAULT_TO_TOKEN)
  )
  const [fromToken, setFromToken] = useState(
    coreTokens.find((token) => token.symbol === DEFAULT_FROM_TOKEN)
  )
  const [isSelectingToToken, setIsSelectingToToken] = useState(false)
  const [isSelectingFromToken, setIsSelectingFromToken] = useState(false)
  const [toAmount, setToAmount] = useState<null | string>(null)
  const [fromAmount, setFromAmount] = useState<null | string>(null)

  const handleReview = () => {}

  const allowReview = false

  const handleSelectFromToken = () => {
    setIsSelectingFromToken(true)
  }

  const handleSelectToToken = () => {
    setIsSelectingToToken(true)
  }

  const handleCloseTokenSelect = () => {
    setIsSelectingFromToken(false)
    setIsSelectingToToken(false)
  }

  const handleSelectToken = (tokenAddress: string) => {
    if (isSelectingFromToken) {
      setFromToken(coreTokens.find((token) => token.address === tokenAddress))
      setIsSelectingFromToken(false)
    } else if (isSelectingToToken) {
      setToToken(coreTokens.find((token) => token.address === tokenAddress))
      setIsSelectingToToken(false)
    }
  }

  const handleChangeFromAmount = (value: string) => {
    setFromAmount(value)
    if (!value) {
      setToAmount(null)
    } else if (value && exchangeRate) {
      setToAmount(new BigNumber(value).multipliedBy(exchangeRate).toString())
    }
  }

  const handleChangeToAmount = (value: string) => {
    setToAmount(value)
    if (!value) {
      setFromAmount(null)
    } else if (exchangeRate) {
      setFromAmount(new BigNumber(value).dividedBy(exchangeRate).toString())
    }
  }

  useEffect(() => {
    setExchangeRate(new BigNumber(3))
    // fetch and set exchange rate
  }, [toToken, fromToken])

  if (!toToken || !fromToken) {
    // should not happen
    return null
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <DrawerTopBar
        middleElement={<Text style={headerStyles.headerTitle}>{t('swapScreen.title')}</Text>}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.swapAmountsContainer}>
          <SwapAmountInput
            label={t('swapScreen.swapFrom')}
            onInputChange={handleChangeFromAmount}
            inputValue={fromAmount}
            onPressMax={() => {}}
            onSelectToken={handleSelectFromToken}
            token={fromToken}
          />
          <SwapAmountInput
            label={t('swapScreen.swapTo')}
            onInputChange={handleChangeToAmount}
            inputValue={toAmount}
            onPressMax={() => {}}
            onSelectToken={handleSelectToToken}
            token={toToken}
          />
        </View>
        <Button
          onPress={handleReview}
          text={t('swapScreen.review')}
          size={BtnSizes.FULL}
          disabled={allowReview}
        />

        <TokenBottomSheet
          isVisible={isSelectingToToken || isSelectingFromToken}
          origin={TokenPickerOrigin.Swap}
          onTokenSelected={handleSelectToken}
          onClose={handleCloseTokenSelect}
          tokens={Object.values(coreTokens)}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.Regular16,
    flex: 1,
  },
  swapAmountsContainer: {
    paddingBottom: Spacing.Thick24,
  },
})

export default SwapScreen
