import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import FeeDrawer from 'src/components/FeeDrawer'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { tokensByCurrencySelector } from 'src/tokens/selectors'
import CommentSection from 'src/transactions/CommentSection'
import TransferAvatars from 'src/transactions/TransferAvatars'
import { FeeType, TokenTransfer } from 'src/transactions/types'
import UserSection from 'src/transactions/UserSection'
import { Currency } from 'src/utils/currencies'

function TransferSentContent({ transfer }: { transfer: TokenTransfer }) {
  const { amount, metadata, address, fees } = transfer

  const { t } = useTranslation()
  const info = useSelector(recipientInfoSelector)

  const tokensByCurrency = useSelector(tokensByCurrencySelector)
  const celoAddress = tokensByCurrency[Currency.Celo]?.address

  const isCeloWithdrawal = amount.tokenAddress === celoAddress
  const recipient = getRecipientFromAddress(address, info, metadata.title, metadata.image)

  const securityFeeAmount = fees.find((fee) => fee.type === FeeType.SecurityFee)
  const dekFeeAmount = fees.find((fee) => fee.type === FeeType.EncryptionFee)
  const feeCurrencyInfo = Object.entries(tokensByCurrency).find(
    ([_, tokenInfo]) => tokenInfo?.address === securityFeeAmount?.amount.tokenAddress
  )

  const securityFee = securityFeeAmount ? new BigNumber(securityFeeAmount.amount.value) : undefined
  const dekFee = dekFeeAmount ? new BigNumber(dekFeeAmount.amount.value) : undefined
  const totalFeeOrZero = new BigNumber(0).plus(securityFee ?? 0).plus(dekFee ?? 0)
  const totalFee = totalFeeOrZero.isZero() ? undefined : totalFeeOrZero

  return (
    <>
      <UserSection
        type={isCeloWithdrawal ? 'withdrawn' : 'sent'}
        recipient={recipient}
        avatar={<TransferAvatars type="sent" recipient={recipient} />}
      />
      <CommentSection comment={metadata.comment} />
      <HorizontalLine />
      <LineItemRow
        title={t(isCeloWithdrawal ? 'amountCeloWithdrawn' : 'amountSent')}
        amount={
          <TokenDisplay amount={amount.value} tokenAddress={amount.tokenAddress} hideSign={true} />
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
