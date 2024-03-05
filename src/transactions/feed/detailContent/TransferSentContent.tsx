import BigNumber from 'bignumber.js'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import HorizontalLine from 'src/components/HorizontalLine'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import CommentSection from 'src/transactions/CommentSection'
import TransferAvatars from 'src/transactions/TransferAvatars'
import UserSection from 'src/transactions/UserSection'
import NetworkFeeRowItem from 'src/transactions/feed/detailContent/NetworkFeeRowItem'
import { TokenTransfer } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'

// Note that this is tested from TransactionDetailsScreen.test.tsx
function TransferSentContent({ transfer }: { transfer: TokenTransfer }) {
  const { amount, metadata, address } = transfer

  const { t } = useTranslation()
  const info = useSelector(recipientInfoSelector)

  const celoTokenId = useTokenInfo(networkConfig.currencyToTokenId[Currency.Celo])?.tokenId
  const transferTokenInfo = useTokenInfo(transfer.amount.tokenId)

  const isCeloWithdrawal = amount.tokenId === celoTokenId
  const recipient = getRecipientFromAddress(address, info, metadata.title, metadata.image)

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
      <NetworkFeeRowItem fees={transfer.fees} transactionStatus={transfer.status} />
      <LineItemRow
        title={t('amountSent')}
        textStyle={typeScale.labelSemiBoldMedium}
        style={styles.amountSentContainer}
        amount={
          <TokenDisplay
            amount={transfer.amount.value}
            tokenId={transfer.amount.tokenId}
            showLocalAmount={false}
            hideSign={true}
            testID="TransferSent/AmountSentValue"
          />
        }
      />
      <LineItemRow
        title={
          <Trans
            i18nKey={'tokenExchangeRateApprox'}
            tOptions={{ symbol: transferTokenInfo?.symbol }}
          >
            <TokenDisplay
              amount={new BigNumber(1)}
              tokenId={transfer.amount.tokenId}
              showLocalAmount={true}
              testID="TransferSent/TransferTokenExchangeRate"
            />
          </Trans>
        }
        amount={
          <TokenDisplay
            amount={transfer.amount.value}
            tokenId={transfer.amount.tokenId}
            showLocalAmount={true}
            hideSign={true}
            testID="TransferSent/AmountSentValueFiat"
          />
        }
        style={styles.tokenFiatValueContainer}
        textStyle={styles.tokenFiatValueText}
      />
    </>
  )
}

const styles = StyleSheet.create({
  amountSentContainer: {
    marginTop: Spacing.Small12,
  },
  tokenFiatValueContainer: {
    marginTop: -Spacing.Tiny4,
  },
  tokenFiatValueText: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
})

export default TransferSentContent
