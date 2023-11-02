import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import HorizontalLine from 'src/components/HorizontalLine'
import LegacyFeeDrawer from 'src/components/LegacyFeeDrawer'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { usePaidFees } from 'src/fees/hooks'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { useTokenInfo } from 'src/tokens/hooks'
import CommentSection from 'src/transactions/CommentSection'
import TransferAvatars from 'src/transactions/TransferAvatars'
import UserSection from 'src/transactions/UserSection'
import { TokenTransfer } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'

// Note that this is tested from TransactionDetailsScreen.test.tsx
function TransferSentContent({ transfer }: { transfer: TokenTransfer }) {
  const { amount, metadata, address, fees } = transfer

  const { t } = useTranslation()
  const info = useSelector(recipientInfoSelector)

  const celoTokenId = useTokenInfo(networkConfig.currencyToTokenId[Currency.Celo])?.tokenId

  const isCeloWithdrawal = amount.tokenId === celoTokenId
  const recipient = getRecipientFromAddress(address, info, metadata.title, metadata.image)

  const { securityFee, dekFee, totalFee, feeCurrency } = usePaidFees(fees)
  const totalFromFeesInLocal = fees.reduce(
    (sum, fee) => sum.plus(fee.amount?.localAmount?.value ?? 0),
    new BigNumber(0)
  )

  return (
    <>
      <UserSection
        type={isCeloWithdrawal ? 'withdrawn' : 'sent'}
        recipient={recipient}
        avatar={<TransferAvatars type="sent" recipient={recipient} />}
        testID="TransferSent"
      />
      <CommentSection comment={metadata.comment} isSend={true} />
      <HorizontalLine />
      <LineItemRow
        title={isCeloWithdrawal ? t('amountCeloWithdrawn') : t('amountSent')}
        amount={
          <TokenDisplay
            amount={amount.value}
            tokenId={amount.tokenId}
            localAmount={amount.localAmount}
            hideSign={true}
            testID="SentAmount"
          />
        }
      />
      <LegacyFeeDrawer
        currency={feeCurrency}
        securityFee={securityFee}
        dekFee={dekFee}
        totalFee={totalFee}
        showLocalAmount={true}
      />
      <TokenTotalLineItem
        tokenAmount={new BigNumber(amount.value)}
        tokenId={amount.tokenId}
        localAmount={
          amount.localAmount
            ? {
                ...amount.localAmount,
                value: new BigNumber(amount.localAmount.value)
                  .absoluteValue()
                  .plus(totalFromFeesInLocal)
                  .toString(),
              }
            : undefined
        }
        feeToAddInUsd={undefined}
        hideSign={true}
      />
    </>
  )
}

export default TransferSentContent
