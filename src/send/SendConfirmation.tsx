import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SendEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import {
  ReviewContent,
  ReviewDetails,
  ReviewDetailsItem,
  ReviewFooter,
  ReviewSummary,
  ReviewSummaryItem,
  ReviewSummaryItemContact,
  ReviewTransaction,
} from 'src/components/ReviewTransaction'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencyCode, getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { sendPayment } from 'src/send/actions'
import { isSendingSelector } from 'src/send/selectors'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { useAmountAsUsd, useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getFeeCurrencyAndAmounts, PreparedTransactionsResult } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>

const DEBOUNCE_TIME_MS = 250

export const sendConfirmationScreenNavOptions = noHeader

function useDisplaySendAmounts({
  tokenAmount,
  localAmount,
  tokenInfo,
  prepareTransactionsResult,
}: {
  tokenInfo: TokenBalance | undefined
  tokenAmount: BigNumber | null
  localAmount: BigNumber | null
  prepareTransactionsResult: PreparedTransactionsResult | undefined
}) {
  const { maxFeeAmount, feeCurrency: feeTokenInfo } =
    getFeeCurrencyAndAmounts(prepareTransactionsResult)
  const feeAmount = maxFeeAmount ?? new BigNumber(0)
  const localFeeAmount = useTokenToLocalAmount(feeAmount, feeTokenInfo?.tokenId)

  const networkFee = useMemo(
    () => ({
      localAmount,
      feeTokenSymbol: feeTokenInfo?.symbol,
      displayTokenAmount: formatValueToDisplay(feeAmount),
      displayLocalAmount: localFeeAmount ? formatValueToDisplay(localFeeAmount) : undefined,
    }),
    [localFeeAmount, feeAmount, feeTokenInfo]
  )

  const total = useMemo(() => {
    const totalLocalAmount = localAmount && localFeeAmount ? localAmount.plus(localFeeAmount) : null
    const displayLocalAmount = totalLocalAmount ? formatValueToDisplay(totalLocalAmount) : ''

    if (tokenInfo?.tokenId !== feeTokenInfo?.tokenId) {
      return {
        type: 'multiple-tokens' as const,
        token1: {
          amount: tokenAmount ? formatValueToDisplay(tokenAmount) : '',
          symbol: tokenInfo?.symbol,
        },
        token2: { amount: formatValueToDisplay(feeAmount), symbol: feeTokenInfo?.symbol },
      }
    }

    const totalTokenAmount = (tokenAmount ?? new BigNumber(0)).plus(feeAmount ?? new BigNumber(0))
    const displayTokenAmount = formatValueToDisplay(totalTokenAmount)
    return {
      type: 'same-token' as const,
      tokenAmount: totalTokenAmount,
      displayLocalAmount,
      displayTokenAmount,
      tokenSymbol: tokenInfo?.symbol,
    }
  }, [tokenInfo, feeTokenInfo, tokenAmount, feeAmount, localAmount, localFeeAmount])

  return { networkFee, total }
}

export default function SendConfirmation(props: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const {
    origin,
    transactionData: { recipient, tokenAmount, tokenAddress, tokenId },
  } = props.route.params

  const {
    prepareTransactionsResult,
    refreshPreparedTransactions,
    clearPreparedTransactions,
    prepareTransactionLoading,
  } = usePrepareSendTransactions()

  const tokenInfo = useTokenInfo(tokenId)
  const isSending = useSelector(isSendingSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD
  const localAmount = useTokenToLocalAmount(tokenAmount, tokenId)
  const usdAmount = useAmountAsUsd(tokenAmount, tokenId)
  const displayAmounts = useDisplaySendAmounts({
    tokenAmount,
    localAmount,
    tokenInfo,
    prepareTransactionsResult,
  })

  const walletAddress = useSelector(walletAddressSelector)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, tokenInfo!.networkId))

  useEffect(() => {
    if (!walletAddress || !tokenInfo) {
      return // should never happen
    }
    clearPreparedTransactions()
    const debouncedRefreshTransactions = setTimeout(() => {
      return refreshPreparedTransactions({
        amount: tokenAmount,
        token: tokenInfo,
        recipientAddress: recipient.address,
        walletAddress,
        feeCurrencies,
      })
    }, DEBOUNCE_TIME_MS)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [tokenInfo, tokenAmount, recipient, walletAddress, feeCurrencies])

  const disableSend =
    isSending || !prepareTransactionsResult || prepareTransactionsResult.type !== 'possible'

  const onSend = () => {
    const preparedTransaction =
      prepareTransactionsResult &&
      prepareTransactionsResult.type === 'possible' &&
      prepareTransactionsResult.transactions[0]
    if (!preparedTransaction) {
      // This should never happen because the confirm button is disabled if this happens.
      dispatch(showError(ErrorMessages.SEND_PAYMENT_FAILED))
      return
    }

    AppAnalytics.track(SendEvents.send_confirm_send, {
      origin,
      recipientType: recipient.recipientType,
      isScan: props.route.params.isFromScan,
      localCurrency: localCurrencyCode,
      usdAmount: usdAmount?.toString() ?? null,
      localCurrencyAmount: localAmount?.toString() ?? null,
      tokenAmount: tokenAmount.toString(),
      tokenSymbol: tokenInfo?.symbol ?? '',
      tokenAddress: tokenAddress ?? null,
      networkId: tokenInfo?.networkId ?? null,
      tokenId,
      isTokenManuallyImported: !!tokenInfo?.isManuallyImported,
    })

    dispatch(
      sendPayment(
        tokenAmount,
        tokenId,
        usdAmount,
        recipient,
        // TODO remove fromModal from `sendPayment`
        false,
        getSerializablePreparedTransaction(preparedTransaction)
      )
    )
  }

  return (
    <ReviewTransaction
      title="Review Send"
      headerAction={<BackButton eventName={SendEvents.send_confirm_back} />}
    >
      <ReviewContent>
        <ReviewSummary>
          <ReviewSummaryItem
            testID="SendConfirmationToken"
            header="Sending"
            icon={<TokenIcon token={tokenInfo} />}
            title={t('tokenAmount', {
              amount: formatValueToDisplay(tokenAmount),
              symbol: tokenInfo?.symbol ?? '',
            })}
            subtitle={t('localAmount', {
              amount: formatValueToDisplay(localAmount ?? new BigNumber(0)),
              symbol: localCurrencySymbol,
              context: localAmount ? undefined : 'noFiatPrice',
            })}
          />

          <ReviewSummaryItemContact
            testID="SendConfirmationRecipient"
            header="To"
            recipient={recipient}
          />
        </ReviewSummary>

        <ReviewDetails>
          <ReviewDetailsItem
            testID="SendConfirmationNetwork"
            label={t('transactionDetails.network')}
            value={tokenInfo && NETWORK_NAMES[tokenInfo.networkId]}
          />
          <ReviewDetailsItem
            testID="SendConfirmationFee"
            label={t('networkFee')}
            isLoading={prepareTransactionLoading}
            value={
              <Trans
                i18nKey={'reviewTransaction.tokenAndLocalDisplayAmountApprox'}
                context={displayAmounts.networkFee.localAmount?.gt(0) ? undefined : 'noFiatPrice'}
                values={{
                  tokenAmount: displayAmounts.networkFee.displayTokenAmount,
                  localAmount: displayAmounts.networkFee.displayLocalAmount,
                  tokenSymbol: displayAmounts.networkFee.feeTokenSymbol,
                  localCurrencySymbol,
                }}
              >
                <Text />
              </Trans>
            }
          />
          <ReviewDetailsItem
            testID="SendConfirmationTotal"
            variant="bold"
            label={t('reviewTransaction.totalPlusFees')}
            isLoading={prepareTransactionLoading}
            value={
              displayAmounts.total.type === 'same-token' ? (
                <Trans
                  i18nKey={'reviewTransaction.tokenAndLocalDisplayAmountApprox'}
                  context={displayAmounts.total.tokenAmount?.gt(0) ? undefined : 'noFiatPrice'}
                  values={{
                    tokenAmount: displayAmounts.total.displayTokenAmount,
                    localAmount: displayAmounts.total.displayLocalAmount,
                    tokenSymbol: displayAmounts.total.tokenSymbol,
                    localCurrencySymbol,
                  }}
                >
                  <Text style={styles.totalPlusFeesLocalAmount} />
                </Trans>
              ) : (
                t('reviewTransaction.totalDisplayAmountForMultipleTokens', {
                  amount1: displayAmounts.total.token1.amount,
                  symbol1: displayAmounts.total.token1.symbol,
                  amount2: displayAmounts.total.token2.amount,
                  symbol2: displayAmounts.total.token2.symbol,
                })
              )
            }
          />
        </ReviewDetails>
      </ReviewContent>

      <ReviewFooter>
        <Button
          testID="ConfirmButton"
          text={t('send')}
          accessibilityLabel={t('send')}
          onPress={onSend}
          showLoading={isSending}
          size={BtnSizes.FULL}
          disabled={disableSend}
        />
      </ReviewFooter>
    </ReviewTransaction>
  )
}

const styles = StyleSheet.create({
  totalPlusFeesLocalAmount: {
    color: Colors.textSecondary,
  },
})
