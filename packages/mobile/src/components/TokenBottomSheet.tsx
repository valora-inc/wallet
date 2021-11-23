import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenDisplay from 'src/components/TokenDisplay'
import { useShowOrHideAnimation } from 'src/components/useShowOrHideAnimation'
import useSelector from 'src/redux/useSelector'
import { TokenBalance } from 'src/tokens/reducer'
import { coreTokensSelector, tokensWithBalanceSelector } from 'src/tokens/selectors'

export enum TokenPickerOrigin {
  Send = 'Send',
  SendConfirmation = 'SendConfirmation',
  Exchange = 'Exchange',
}

interface Props {
  isVisible: boolean
  origin: TokenPickerOrigin
  onTokenSelected: (tokenAddress: string) => void
  onClose: () => void
  isOutgoingPaymentRequest?: boolean
}

const MIN_EMPTY_SPACE = 100

function TokenOption({ tokenInfo, onPress }: { tokenInfo: TokenBalance; onPress: () => void }) {
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
            tokenAddress={tokenInfo.address}
            showLocalAmount={true}
            testID={`Local${tokenInfo.symbol}Balance`}
          />
          <TokenDisplay
            style={styles.currencyBalance}
            amount={tokenInfo.balance}
            tokenAddress={tokenInfo.address}
            showLocalAmount={false}
            testID={`${tokenInfo.symbol}Balance`}
          />
        </View>
      </View>
    </Touchable>
  )
}
// TODO: In the exchange flow or when requesting a payment, only show CELO & stable tokens.
function TokenBottomSheet({
  isVisible,
  origin,
  onTokenSelected,
  onClose,
  isOutgoingPaymentRequest,
}: Props) {
  const [showingOptions, setOptionsVisible] = useState(isVisible)
  const [pickerHeight, setPickerHeight] = useState(0)

  const tokens = useSelector(tokensWithBalanceSelector)
  const coreTokens = useSelector(coreTokensSelector)

  const { t } = useTranslation()

  const onTokenPressed = (tokenAddress: string) => () => {
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      tokenAddress,
    })
    onTokenSelected(tokenAddress)
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

  const maxHeight = Dimensions.get('window').height - MIN_EMPTY_SPACE
  const paddingBottom = Math.max(safeAreaInsets.bottom, Spacing.Thick24)

  return (
    <View style={styles.container} testID="TokenBottomSheetContainer">
      <Animated.View style={[styles.background, animatedOpacity]}>
        <TouchableWithoutFeedback
          style={styles.backgroundTouchable}
          onPress={onClose}
          testID={'BackgroundTouchable'}
        />
      </Animated.View>
      <Animated.ScrollView
        style={[styles.contentContainer, { paddingBottom, maxHeight }, animatedPickerPosition]}
        contentContainerStyle={pickerHeight >= maxHeight ? styles.fullHeightScrollView : undefined}
        onLayout={onLayout}
      >
        <Text style={styles.title}>{t('selectToken')}</Text>
        {isOutgoingPaymentRequest
          ? coreTokens.map((tokenInfo, index) => {
              ;<React.Fragment key={`token-${tokenInfo.address}`}>
                {index > 0 && <View style={styles.separator} />}
                <TokenOption tokenInfo={tokenInfo} onPress={onTokenPressed(tokenInfo.address)} />
              </React.Fragment>
            })
          : tokens.map((tokenInfo, index) => {
              ;<React.Fragment key={`token-${tokenInfo.address}`}>
                {index > 0 && <View style={styles.separator} />}
                <TokenOption tokenInfo={tokenInfo} onPress={onTokenPressed(tokenInfo.address)} />
              </React.Fragment>
            })}
      </Animated.ScrollView>
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
  fullHeightScrollView: {
    paddingBottom: 50,
  },
})

export default TokenBottomSheet
