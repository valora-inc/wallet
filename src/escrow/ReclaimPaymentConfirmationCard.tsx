import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import Avatar from 'src/components/Avatar'
import { SecurityFeeIcon } from 'src/components/FeeIcon'
import HorizontalLine from 'src/components/HorizontalLine'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { FeeType } from 'src/fees/reducer'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { MobileRecipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { useTokenInfo, useUsdToTokenAmount } from 'src/tokens/hooks'
import { celoAddressSelector } from 'src/tokens/selectors'
import { divideByWei } from 'src/utils/formatting'

interface Props {
  recipientPhone: string
  recipientContact: MobileRecipient
  amount: BigNumber
  tokenAddress: string
}

export default function ReclaimPaymentConfirmationCard({
  recipientPhone,
  recipientContact,
  amount: amountInWei,
  tokenAddress,
}: Props) {
  const { t } = useTranslation()
  const amount = divideByWei(amountInWei)

  const feeEstimates = useSelector(feeEstimatesSelector)
  const feeEstimate = feeEstimates[tokenAddress]?.[FeeType.RECLAIM_ESCROW]

  const celoAddress = useSelector(celoAddressSelector)
  const feeToken = useTokenInfo(feeEstimate?.feeInfo?.feeCurrency ?? celoAddress ?? '')
  const feeInAmountToken = useUsdToTokenAmount(
    new BigNumber(feeEstimate?.usdFee ?? 0),
    tokenAddress
  )
  const totalAmount = amount.minus(feeInAmountToken ?? 0)

  return (
    <View style={styles.container}>
      <Avatar recipient={recipientContact} e164Number={recipientPhone} />
      <HorizontalLine />
      <LineItemRow
        title={t('amount')}
        amount={<TokenDisplay amount={amount} tokenAddress={tokenAddress} />}
        testID={'ReclaimAmount'}
      />
      <LineItemRow
        title={t('securityFee')}
        titleIcon={<SecurityFeeIcon />}
        amount={
          feeEstimate?.feeInfo?.fee && (
            <TokenDisplay
              amount={divideByWei(feeEstimate.feeInfo.fee)}
              tokenAddress={feeToken?.address ?? ''}
              testID={'ReclaimFee'}
            />
          )
        }
        testID={'SecurityFee'}
        isLoading={feeEstimate?.loading}
        hasError={!!feeEstimate?.error}
      />
      <HorizontalLine />
      <TokenTotalLineItem
        title={t('totalRefunded')}
        tokenAmount={totalAmount}
        tokenAddress={tokenAddress}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
})
