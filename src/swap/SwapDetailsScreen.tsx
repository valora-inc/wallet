import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import ArrowRightThick from 'src/icons/ArrowRightThick'
import InfoIcon from 'src/icons/InfoIcon'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import SwapIcon from 'src/swap/icons/SwapIcon'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'

type Props = NativeStackScreenProps<StackParamList, Screens.SwapDetailsScreen>

function DetailsBlock({
  title,
  icon,
  onPress,
  children,
}: {
  title: string
  icon: React.ReactNode
  onPress?: () => void
  children: React.ReactNode | React.ReactNode[]
}) {
  return (
    <Touchable disabled={!onPress} onPress={onPress} borderRadius={12}>
      <View style={styles.detailsBlockContainer}>
        <View style={styles.detailsBlockHeader}>
          {icon}
          <Text style={styles.detailsBlockTitle}>{title}</Text>
        </View>
        {children}
      </View>
    </Touchable>
  )
}

function SwapSummaryRow({
  label,
  token,
  amount,
}: {
  label: string
  token: TokenBalance
  amount: BigNumber
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{label}</Text>
      <View style={styles.swapTokenRow}>
        <Text style={styles.text}>{formatValueToDisplay(amount)}</Text>
        <TokenIcon token={token} size={IconSize.XSMALL} />
        <Text style={styles.text}>{token.symbol}</Text>
      </View>
    </View>
  )
}

function SwapDetailsScreen({ route }: Props) {
  const { toTokenId, fromTokenId, quote } = route.params
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const toToken = useTokenInfo(toTokenId)
  const fromToken = useTokenInfo(fromTokenId)

  if (!toToken || !fromToken) {
    Logger.error('SwapDetailsScreen', 'From or to token not found, cannot render screen')
    return null
  }

  const isCrossChainSwap = fromToken.networkId !== toToken.networkId
  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaContainer}>
      <CustomHeader
        style={styles.customHeader}
        left={<BackButton />}
        title={t('swapDetailsScreen.title')}
      />
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, Spacing.Thick24) },
        ]}
      >
        <DetailsBlock
          title={t('swapDetailsScreen.swapSummary.title')}
          icon={<SwapIcon color={Colors.black} />}
        >
          <SwapSummaryRow
            label={t('swapDetailsScreen.swapSummary.from')}
            token={fromToken}
            amount={quote.swapAmount}
          />
          <SwapSummaryRow
            label={t('swapDetailsScreen.swapSummary.to')}
            token={toToken}
            amount={quote.swapAmount.multipliedBy(quote.price)}
          />
          <View style={styles.row}>
            <Text style={styles.text}>{t('swapDetailsScreen.swapSummary.network')}</Text>
            <View style={styles.swapTokenRow}>
              <Text style={styles.text}>{NETWORK_NAMES[fromToken.networkId]}</Text>
              {isCrossChainSwap && (
                <>
                  <ArrowRightThick size={16} />
                  <Text style={styles.text}>{NETWORK_NAMES[toToken.networkId]}</Text>
                </>
              )}
            </View>
          </View>
          {isCrossChainSwap && (
            <View style={styles.infoRow}>
              <InfoIcon size={12} color={Colors.gray3} />
              <Text style={styles.infoText}>
                {t('swapDetailsScreen.swapSummary.crossChainInfo', {
                  destinationNetworkName: NETWORK_NAMES[toToken.networkId],
                })}
              </Text>
            </View>
          )}
        </DetailsBlock>
      </ScrollView>
      {/* TODO: add bottom sheets */}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  customHeader: {
    paddingHorizontal: Spacing.Regular16,
  },
  contentContainer: {
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Smallest8,
    gap: Spacing.Regular16,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  swapTokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.Tiny4,
    marginTop: Spacing.Smallest8,
  },
  text: {
    ...typeScale.bodyXSmall,
  },
  infoText: {
    ...typeScale.bodyXXSmall,
    color: Colors.gray3,
    flex: 1,
  },
  detailsBlockContainer: {
    padding: Spacing.Regular16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray2,
    gap: Spacing.Smallest8,
  },
  detailsBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Smallest8,
  },
  detailsBlockTitle: {
    ...typeScale.labelSemiBoldXSmall,
  },
})

export default SwapDetailsScreen
