import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import FeeDrawer from 'src/components/FeeDrawer'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { usePaidFees } from 'src/fees/hooks'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { tokensByCurrencySelector } from 'src/tokens/selectors'
import CommentSection from 'src/transactions/CommentSection'
import TransferAvatars from 'src/transactions/TransferAvatars'
import { TokenTransfer } from 'src/transactions/types'
import UserSection from 'src/transactions/UserSection'
import { Currency } from 'src/utils/currencies'

// Note that this is tested from TransactionDetailsScreen.test.tsx
function TransferSentContent({ transfer }: { transfer: TokenTransfer }) {
  const { amount, metadata, address, fees } = transfer

  const { t } = useTranslation()
  const info = useSelector(recipientInfoSelector)

  const tokensByCurrency = useSelector(tokensByCurrencySelector)
  const celoAddress = tokensByCurrency[Currency.Celo]?.address

  const isCeloWithdrawal = amount.tokenAddress === celoAddress
  const recipient = getRecipientFromAddress(address, info, metadata.title, metadata.image)

  const { securityFee, dekFee, totalFee, feeCurrencyInfo } = usePaidFees(fees)

  return (
    <>
      <UserSection
        type={isCeloWithdrawal ? 'withdrawn' : 'sent'}
        recipient={recipient}
        avatar={<TransferAvatars type="sent" recipient={recipient} />}
        testID="TransferSent"
      />
      <CommentSection comment={metadata.comment} />
      <HorizontalLine />
      <LineItemRow
        title={isCeloWithdrawal ? t('amountCeloWithdrawn') : t('amountSent')}
        amount={
          <TokenDisplay
            amount={amount.value}
            tokenAddress={amount.tokenAddress}
            hideSign={true}
            testID="SentAmount"
          />
        }
      />
      <FeeDrawer
        currency={feeCurrencyInfo ? (feeCurrencyInfo[0] as Currency) : undefined}
        securityFee={securityFee}
        dekFee={dekFee}
        totalFee={totalFee}
        showLocalAmount={true}
      />
      <TokenTotalLineItem
        tokenAmount={new BigNumber(amount.value)}
        tokenAddress={amount.tokenAddress}
        feeToAddInUsd={undefined}
        hideSign={true}
      />
    </>
  )
}

export default TransferSentContent
