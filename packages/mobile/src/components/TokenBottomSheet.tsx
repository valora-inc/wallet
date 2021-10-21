import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenDisplay from 'src/components/TokenDisplay'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import { Namespaces } from 'src/i18n'
import useSelector from 'src/redux/useSelector'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/reducer'
import { tokenBalancesSelector } from 'src/tokens/selectors'

export enum TokenPickerOrigin {
  Send = 'Send',
  SendConfirmation = 'SendConfirmation',
  Exchange = 'Exchange',
}

interface Props {
  isVisible: boolean
  origin: TokenPickerOrigin
  onTokenSelected: (token: string) => void
  onClose: () => void
}

function TokenOption({ tokenAddress, onPress }: { tokenAddress: string; onPress: () => void }) {
  const tokenInfo = useTokenInfo(tokenAddress)
  if (!tokenInfo?.balance) {
    return null
  }

  return (
    <Touchable onPress={onPress} testID={`${tokenInfo.symbol}Touchable`}>
      <View style={styles.tokenOptionContainer}>
        <Image source={{ uri: tokenInfo.imageUrl }} style={styles.tokenImage} />
        <View style={styles.tokenNameContainer}>
          <Text style={styles.localBalance}>{tokenInfo.symbol}</Text>
          <Text style={styles.currencyBalance}>{tokenInfo.name}</Text>
        </View>
        <View style={styles.tokenBalanceContainer}>
          <TokenDisplay
            style={styles.localBalance}
            amount={tokenInfo.balance}
            tokenAddress={tokenAddress}
            showLocalAmount={true}
            testID={`Local${tokenInfo.symbol}Balance`}
          />
          <TokenDisplay
            style={styles.currencyBalance}
            amount={tokenInfo.balance}
            tokenAddress={tokenAddress}
            showLocalAmount={false}
            testID={`${tokenInfo.symbol}Balance`}
          />
        </View>
      </View>
    </Touchable>
  )
}

function filterZeroBalanceTokens(tokenInfo: TokenBalance | undefined) {
  if (!tokenInfo?.balance || !tokenInfo?.usdPrice) {
    return false
  }
  return tokenInfo.balance.multipliedBy(tokenInfo.usdPrice).gte(0.01)
}

function TokenBottomSheet({ isVisible, origin, onTokenSelected, onClose }: Props) {
  const [showingOptions, setOptionsVisible] = useState(isVisible)
  const [pickerHeight, setPickerHeight] = useState(0)
  const tokensInfo = useSelector(tokenBalancesSelector)

  const { t } = useTranslation(Namespaces.sendFlow7)

  const onTokenPressed = (token: string) => () => {
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      token,
    })
    onTokenSelected(token)
  }

  const safeAreaInsets = useSafeAreaInsets()

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
      <Animated.View style={[styles.background, animatedOpacity]}>
        <TouchableWithoutFeedback
          style={styles.backgroundTouchable}
          onPress={onClose}
          testID={'BackgroundTouchable'}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.contentContainer,
          { paddingBottom: Math.max(safeAreaInsets.bottom, Spacing.Thick24) },
          animatedPickerPosition,
        ]}
        onLayout={onLayout}
      >
        <Text style={styles.title}>{t('selectToken')}</Text>
        {Object.values(tokensInfo)
          .filter(filterZeroBalanceTokens)
          .map((tokenInfo, index) => {
            return (
              <>
                {index > 0 && <View style={styles.separator} />}
                <TokenOption
                  tokenAddress={tokenInfo!.address}
                  onPress={onTokenPressed(tokenInfo!.address)}
                />
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
    zIndex: 1,
  },
  background: {
    position: 'absolute',
    backgroundColor: colors.modalBackdrop,
    opacity: 0.5,
    width: '100%',
    height: '100%',
  },
  backgroundTouchable: {
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
  tokenOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  tokenNameContainer: {
    alignItems: 'flex-start',
  },
  tokenBalanceContainer: {
    flex: 1,
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
