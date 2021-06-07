import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import { Namespaces } from 'src/i18n'
import { useBalance } from 'src/stableToken/hooks'
import { Currency, STABLE_CURRENCIES } from 'src/utils/currencies'

export enum TokenPickerOrigin {
  Send = 'Send',
  Exchange = 'Exchange',
}

interface Props {
  isVisible: boolean
  origin: TokenPickerOrigin
  onCurrencySelected: (currency: Currency) => void
}

function CurrencyOption({ currency, onPress }: { currency: Currency; onPress: () => void }) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const balance = useBalance(currency)
  const amount = {
    value: new BigNumber(balance ?? '0'),
    currencyCode: currency,
  }
  return (
    <Touchable onPress={onPress} testID={`${currency}Touchable`}>
      <View style={styles.currencyOptionContainer}>
        <Text style={styles.optionName}>{t('stableBalance', { token: currency })}</Text>
        <View style={styles.currencyBalanceContainer}>
          <CurrencyDisplay
            style={styles.localBalance}
            amount={amount}
            showLocalAmount={true}
            testID={`Local${currency}Balance`}
          />
          <CurrencyDisplay
            style={styles.currencyBalance}
            amount={amount}
            showLocalAmount={false}
            hideCode={false}
            hideSymbol={true}
            testID={`${currency}Balance`}
          />
        </View>
      </View>
    </Touchable>
  )
}

function TokenBottomSheet({ isVisible, origin, onCurrencySelected }: Props) {
  const [showingOptions, setOptionsVisible] = useState(isVisible)
  const [pickerHeight, setPickerHeight] = useState(0)

  const { t } = useTranslation(Namespaces.sendFlow7)

  const onCurrencyPressed = (currency: Currency) => () => {
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      token: currency,
    })
    onCurrencySelected(currency)
  }

  const progress = useSharedValue(0)
  const animatedPickerPosition = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * pickerHeight }],
  }))
  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: 0.5 * progress.value,
  }))

  useShowOrHideAnimation(
    progress,
    isVisible,
    () => setOptionsVisible(true),
    () => setOptionsVisible(false)
  )

  if (!showingOptions) {
    return null
  }

  const onLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    setPickerHeight(height)
  }

  return (
    <View style={styles.container} testID="TokenBottomSheetContainer">
      <Animated.View style={[styles.background, animatedOpacity]} />
      <Animated.View style={[styles.contentContainer, animatedPickerPosition]} onLayout={onLayout}>
        <Text style={styles.title}>{t('selectBalance')}</Text>
        {STABLE_CURRENCIES.map((currency, index) => {
          return (
            <>
              {index > 0 && <View style={styles.separator} />}
              <CurrencyOption currency={currency} onPress={onCurrencyPressed(currency)} />
            </>
          )
        })}
      </Animated.View>
    </View>
  )
}

TokenBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  background: {
    position: 'absolute',
    backgroundColor: colors.modalBackdrop,
    opacity: 0.5,
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    opacity: 1,
    width: '100%',
    backgroundColor: colors.light,
    padding: Spacing.Thick24,
    borderTopRightRadius: Spacing.Regular16,
    borderTopLeftRadius: Spacing.Regular16,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: Spacing.Smallest8,
  },
  currencyOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  optionName: {
    flex: 1,
    ...fontStyles.regular500,
  },
  currencyBalanceContainer: {
    alignItems: 'flex-end',
  },
  localBalance: {
    ...fontStyles.regular,
  },
  currencyBalance: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.gray2,
  },
})

export default TokenBottomSheet
