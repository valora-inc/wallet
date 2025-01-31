import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Text } from 'react-native'
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
  ReviewTotalValue,
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
import { useAmountAsUsd, useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import Logger from 'src/utils/Logger'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationFromExternal
>

const DEBOUNCE_TIME_MS = 250
const TAG = 'send/SendConfirmation'

export const sendConfirmationScreenNavOptions = noHeader

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

  const fromExternal = props.route.name === Screens.SendConfirmationFromExternal
  const tokenInfo = useTokenInfo(tokenId)
  const isSending = useSelector(isSendingSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD
  const localAmount = useTokenToLocalAmount(tokenAmount, tokenId)
  const usdAmount = useAmountAsUsd(tokenAmount, tokenId)
  const walletAddress = useSelector(walletAddressSelector)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, tokenInfo!.networkId))
  const { maxFeeAmount, feeCurrency: feeTokenInfo } =
    getFeeCurrencyAndAmounts(prepareTransactionsResult)
  const tokenFeeAmount = maxFeeAmount ?? new BigNumber(0)
  const localFeeAmount = useTokenToLocalAmount(tokenFeeAmount, feeTokenInfo?.tokenId)

  const networkFeeDisplayAmount = useMemo(
    () => ({
      token: formatValueToDisplay(tokenFeeAmount),
      local: localFeeAmount ? formatValueToDisplay(localFeeAmount) : undefined,
    }),
    [localFeeAmount, tokenFeeAmount]
  )

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
        fromExternal,
        getSerializablePreparedTransaction(preparedTransaction)
      )
    )
  }

  // Should never happen
  if (!tokenInfo) {
    Logger.error(TAG, `tokenInfo is missing`)
    return null
  }

  return (
    <ReviewTransaction
      title={t('reviewTransaction.title')}
      headerLeftButton={<BackButton eventName={SendEvents.send_confirm_back} />}
    >
      <ReviewContent>
        <ReviewSummary>
          <ReviewSummaryItem
            testID="SendConfirmationToken"
            label={t('sending')}
            icon={<TokenIcon token={tokenInfo} />}
            primaryValue={t('tokenAmount', {
              tokenAmount: formatValueToDisplay(tokenAmount),
              tokenSymbol: tokenInfo.symbol ?? '',
            })}
            secondaryValue={t('localAmount', {
              localAmount: formatValueToDisplay(localAmount ?? new BigNumber(0)),
              localCurrencySymbol,
              context: localAmount ? undefined : 'noFiatPrice',
            })}
          />

          <ReviewSummaryItemContact testID="SendConfirmationRecipient" recipient={recipient} />
        </ReviewSummary>

        <ReviewDetails>
          <ReviewDetailsItem
            testID="SendConfirmationNetwork"
            label={t('transactionDetails.network')}
            value={NETWORK_NAMES[tokenInfo.networkId]}
          />
          <ReviewDetailsItem
            testID="SendConfirmationFee"
            label={t('networkFee')}
            isLoading={prepareTransactionLoading}
            value={
              <Trans
                i18nKey={'tokenAndLocalAmountApprox_oneToken'}
                context={localFeeAmount?.gt(0) ? undefined : 'noFiatPrice'}
                tOptions={{
                  tokenAmount: networkFeeDisplayAmount.token,
                  localAmount: networkFeeDisplayAmount.local,
                  tokenSymbol: feeTokenInfo?.symbol,
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
              <ReviewTotalValue
                tokenInfo={tokenInfo}
                feeTokenInfo={feeTokenInfo}
                tokenAmount={tokenAmount}
                localAmount={localAmount}
                feeTokenAmount={maxFeeAmount}
                feeLocalAmount={localFeeAmount}
                localCurrencySymbol={localCurrencySymbol}
              />
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
