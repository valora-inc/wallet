import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import { Namespaces } from 'src/i18n'
import { useCurrencyBalance } from 'src/stableToken/hooks'
import { CURRENCIES, Currency, CurrencyInfo, STABLE_CURRENCIES } from 'src/utils/currencies'

export enum CurrencyPickerOrigin {
  Send = 'Send',
  Exchange = 'Exchange',
}

interface Props {
  isVisible: boolean
  origin: CurrencyPickerOrigin
  onCurrencySelected: (currency: Currency) => void
}

function CurrencyOption({
  currency,
  currencyInfo,
  onPress,
}: {
  currency: Currency
  currencyInfo: CurrencyInfo
  onPress: () => void
}) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const balance = useCurrencyBalance(currency)
  const amount = {
    value: new BigNumber(balance ?? '0'),
    currencyCode: currencyInfo.code,
  }
  return (
    <TouchableOpacity
      style={styles.currencyOptionContainer}
      onPress={onPress}
      testID={`${currencyInfo.code}Touchable`}
    >
      <Text style={styles.optionName}>{t('stableBalance', { token: currencyInfo.code })}</Text>
      <View style={styles.currencyBalanceContainer}>
        <CurrencyDisplay
          style={styles.localBalance}
          amount={amount}
          showLocalAmount={true}
          testID={`Local${currencyInfo.code}Balance`}
        />
        <CurrencyDisplay
          style={styles.currencyBalance}
          amount={amount}
          showLocalAmount={false}
          hideCode={false}
          hideSymbol={true}
          testID={`${currencyInfo.code}Balance`}
        />
      </View>
    </TouchableOpacity>
  )
}

const PICKER_HEIGHT = 250

function CurrencyPicker({ isVisible, origin, onCurrencySelected }: Props) {
  const [showingOptions, setOptionsVisible] = useState(isVisible)

  const { t } = useTranslation(Namespaces.sendFlow7)

  const onCurrencyPressed = (currency: Currency) => () => {
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      token: CURRENCIES[currency].code,
    })
    onCurrencySelected(currency)
  }

  const progress = useSharedValue(0)
  const animatedPickerPosition = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * PICKER_HEIGHT }],
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

  return (
    <View style={styles.container} testID="CurrencyPickerContainer">
      <Animated.View style={[styles.background, animatedOpacity]} />
      <Animated.View style={[styles.contentContainer, animatedPickerPosition]}>
        <Text style={styles.title}>{t('selectBalance')}</Text>
        {STABLE_CURRENCIES.map((currency, index) => {
          return (
            <>
              {index > 0 && <View style={styles.separator} />}
              <CurrencyOption
                currency={currency}
                currencyInfo={CURRENCIES[currency]}
                onPress={onCurrencyPressed(currency)}
              />
            </>
          )
        })}
      </Animated.View>
    </View>
  )
}

CurrencyPicker.navigationOptions = {}

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
    backgroundColor: colors.light,
    opacity: 1,
    width: '100%',
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
    height: 72,
    alignItems: 'center',
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

export default CurrencyPicker
