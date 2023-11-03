import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import { NETWORK_NAMES } from 'src/shared/conts'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { NetworkId } from 'src/transactions/types'

interface Props {
  networkId?: NetworkId
  networkFee: BigNumber
  networkFeeInfoBottomSheetRef: React.RefObject<BottomSheetRefType>
  slippagePercentage: number
  feeTokenId: string
}

export function SwapTransactionDetails({
  networkId,
  networkFee,
  networkFeeInfoBottomSheetRef,
  feeTokenId,
  slippagePercentage,
}: Props) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Touchable
          style={styles.touchableRow}
          onPress={() => {
            networkFeeInfoBottomSheetRef.current?.snapToIndex(0)
          }}
          disabled={!networkId}
        >
          <>
            <Text style={styles.label}>
              {networkId
                ? t('swapScreen.transactionDetails.networkFee', {
                    networkName: NETWORK_NAMES[networkId],
                  })
                : t('swapScreen.transactionDetails.networkFeeNoNetwork')}
            </Text>
            {networkId && <InfoIcon size={14} color={colors.gray4} />}
          </>
        </Touchable>
        <TokenDisplay
          style={styles.value}
          amount={networkFee}
          tokenId={feeTokenId}
          showLocalAmount={true}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t('swapScreen.transactionDetails.swapFee')}</Text>
        <Text testID={'SwapFee'} style={styles.value}>
          {t('swapScreen.transactionDetails.swapFeeWaived')}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t('swapScreen.transactionDetails.slippagePercentage')}</Text>
        <Text testID={'SwapFee'} style={styles.value}>
          {`${slippagePercentage}%`}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.Tiny4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.Small12,
  },
  touchableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    fontWeight: '600',
  },
  label: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    marginRight: Spacing.Tiny4,
  },
})

export default SwapTransactionDetails
