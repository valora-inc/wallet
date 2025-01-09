import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { showError } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SendEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import {
  Review,
  ReviewContent,
  ReviewDetails,
  ReviewDetailsItem,
  ReviewFooter,
  ReviewSummary,
  ReviewSummaryItem,
  ReviewSummaryItemContact,
} from 'src/components/Review'
import { getDisplayLocalAmount, getDisplayTokenAmount } from 'src/components/TokenEnterAmount'
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
import {
  useAmountAsUsd,
  useDisplayAmount,
  useTokenInfo,
  useTokenToLocalAmount,
} from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { getFeeCurrencyAndAmounts, PreparedTransactionsResult } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>

const DEBOUNCE_TIME_MS = 250

export const sendConfirmationScreenNavOptions = noHeader

function useCalculatedFees({
  localAmount,
  prepareTransactionsResult,
}: {
  localAmount: BigNumber | null
  prepareTransactionsResult: PreparedTransactionsResult | undefined
}) {
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD
  const { maxFeeAmount, feeCurrency: feeTokenInfo } =
    getFeeCurrencyAndAmounts(prepareTransactionsResult)

  const feeAmount = maxFeeAmount ?? new BigNumber(0)
  const localMaxFeeAmount = useTokenToLocalAmount(feeAmount, feeTokenInfo?.tokenId)

  const feeDisplayAmount = useDisplayAmount({
    tokenAmount: maxFeeAmount,
    token: feeTokenInfo,
    approx: true,
  })

  const totalPlusFees = useMemo(() => {
    const total = (localAmount ?? new BigNumber(0)).plus(localMaxFeeAmount ?? new BigNumber(0))
    return getDisplayLocalAmount(total, localCurrencySymbol)
  }, [localAmount, localMaxFeeAmount, localCurrencySymbol])

  return {
    networkName: feeTokenInfo && NETWORK_NAMES[feeTokenInfo.networkId],
    feeDisplayAmount,
    totalPlusFees,
  }
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
  const fromModal = props.route.name === Screens.SendConfirmationModal
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD
  const localAmount = useTokenToLocalAmount(tokenAmount, tokenId)
  const usdAmount = useAmountAsUsd(tokenAmount, tokenId)
  const fees = useCalculatedFees({ localAmount, prepareTransactionsResult })

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
        fromModal,
        getSerializablePreparedTransaction(preparedTransaction)
      )
    )
  }

  return (
    <Review
      title="Review Send"
      headerAction={<BackButton eventName={SendEvents.send_confirm_back} />}
    >
      <ReviewContent>
        <ReviewSummary>
          <ReviewSummaryItem
            testID="SendConfirmationToken"
            header="Sending"
            icon={<TokenIcon token={tokenInfo!} />}
            title={getDisplayTokenAmount(tokenAmount, tokenInfo!)}
            subtitle={getDisplayLocalAmount(localAmount, localCurrencySymbol)}
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
            value={fees.networkName}
            isLoading={prepareTransactionLoading}
          />
          <ReviewDetailsItem
            testID="SendConfirmationFee"
            label={t('networkFee')}
            value={fees.feeDisplayAmount}
            isLoading={prepareTransactionLoading}
          />
          <ReviewDetailsItem
            testID="SendConfirmationTotal"
            variant="bold"
            label={t('totalPlusFees')}
            value={fees.totalPlusFees}
            isLoading={prepareTransactionLoading}
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
    </Review>
  )
}
