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
import TransferAvatars from 'src/transactions/TransferAvatars'
import UserSection from 'src/transactions/UserSection'
import FeeRowItem from 'src/transactions/feed/detailContent/FeeRowItem'
import { FeeType, TokenTransfer } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'

// Note that this is tested from TransactionDetailsScreen.test.tsx
function TransferSentContent({ transfer }: { transfer: TokenTransfer }) {
  const { t } = useTranslation()
  const info = useSelector(recipientInfoSelector)

  const celoTokenId = useTokenInfo(networkConfig.currencyToTokenId[Currency.Celo])?.tokenId
  const transferTokenInfo = useTokenInfo(transfer.amount.tokenId)

  const isCeloWithdrawal = transfer.amount.tokenId === celoTokenId
  const recipient = getRecipientFromAddress(
    transfer.address,
    info,
    transfer.metadata.title,
    transfer.metadata.image
  )

  return (
    <>
      <UserSection
        type={isCeloWithdrawal ? 'withdrawn' : 'sent'}
        recipient={recipient}
        avatar={<TransferAvatars type="sent" recipient={recipient} />}
        testID="TransferSent"
      />
      <HorizontalLine />
      <FeeRowItem
        fees={transfer.fees}
        feeType={FeeType.SecurityFee}
        transactionStatus={transfer.status}
      />
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
              localAmount={
                transfer.amount.localAmount
                  ? {
                      ...transfer.amount.localAmount,
                      value: transfer.amount.localAmount.exchangeRate, // display the historical exchange rate
                    }
                  : undefined
              }
              testID="TransferSent/TransferTokenExchangeRate"
            />
          </Trans>
        }
        amount={
          <TokenDisplay
            amount={transfer.amount.value}
            tokenId={transfer.amount.tokenId}
            localAmount={transfer.amount.localAmount}
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
