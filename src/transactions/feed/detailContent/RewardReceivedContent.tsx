import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import HorizontalLine from 'src/components/HorizontalLine'
import LegacyTokenTotalLineItem from 'src/components/LegacyTokenTotalLineItem'
import { CELO_LOGO_URL } from 'src/config'
import { RecipientType } from 'src/recipients/recipient'
import TransferAvatars from 'src/transactions/TransferAvatars'
import UserSection from 'src/transactions/UserSection'
import { TokenTransfer } from 'src/transactions/types'

// Note that this is tested from TransactionDetailsScreen.test.tsx
function RewardReceivedContent({ transfer }: { transfer: TokenTransfer }) {
  const { amount, metadata, address } = transfer

  const { t } = useTranslation()

  const recipient = {
    address,
    name: metadata.title ?? t('feedItemRewardReceivedTitle'),
    thumbnailPath: metadata.image ?? CELO_LOGO_URL,
    recipientType: RecipientType.Address,
  }

  return (
    <>
      <UserSection
        type="received"
        expandable={false}
        recipient={recipient}
        avatar={<TransferAvatars type="received" recipient={recipient} />}
        testID="RewardReceived"
      />
      <HorizontalLine />
      <LegacyTokenTotalLineItem
        tokenAmount={new BigNumber(amount.value)}
        tokenAddress={amount.tokenAddress}
        localAmount={amount.localAmount}
        feeToAddInUsd={undefined}
        hideSign={true}
      />
    </>
  )
}

export default RewardReceivedContent
