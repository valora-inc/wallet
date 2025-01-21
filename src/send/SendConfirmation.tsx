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
import Logger from 'src/utils/Logger'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>

const DEBOUNCE_TIME_MS = 250
const TAG = 'send/SendConfirmation'

export const sendConfirmationScreenNavOptions = noHeader

export function TotalPlusFees({
  tokenInfo,
  feeTokenInfo,
  tokenAmount,
  localAmount,
  tokenFeeAmount,
  localFeeAmount,
}: {
  tokenInfo: TokenBalance | undefined
  feeTokenInfo: TokenBalance | undefined
  tokenAmount: BigNumber | null
  localAmount: BigNumber | null
  tokenFeeAmount: BigNumber | undefined
  localFeeAmount: BigNumber | null
}) {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD

  // if there are not token info or token amount then it should not even be possible to get to the review screen
  if (!tokenInfo || !tokenAmount) {
    return null
  }

  // if there are no fees then just format token amount
  if (!feeTokenInfo || !tokenFeeAmount) {
    return (
      <Trans
        i18nKey={'tokenAndLocalAmount_oneToken'}
        context={localAmount ? undefined : 'noFiatPrice'}
        tOptions={{
          tokenAmount: formatValueToDisplay(tokenAmount),
          localAmount: localAmount ? formatValueToDisplay(localAmount) : '',
          tokenSymbol: tokenInfo.symbol,
          localCurrencySymbol,
        }}
      >
        <Text style={styles.totalPlusFeesLocalAmount} />
      </Trans>
    )
  }

  const sameToken = tokenInfo.tokenId === feeTokenInfo.tokenId
  const haveLocalPrice =
    !!tokenInfo.priceUsd && !!feeTokenInfo.priceUsd && localAmount && localFeeAmount

  // if single token and have local price - return token and local amounts
  if (sameToken && haveLocalPrice) {
    return (
      <Trans
        i18nKey={'tokenAndLocalAmount_oneToken'}
        tOptions={{
          tokenAmount: formatValueToDisplay(tokenAmount.plus(tokenFeeAmount)),
          localAmount: formatValueToDisplay(localAmount.plus(localFeeAmount)),
          tokenSymbol: tokenInfo.symbol,
          localCurrencySymbol,
        }}
      >
        <Text style={styles.totalPlusFeesLocalAmount} />
      </Trans>
    )
  }

  // if single token but no local price - return token amount
  if (sameToken && !haveLocalPrice) {
    return t('tokenAmount', {
      tokenAmount: tokenAmount.plus(tokenFeeAmount),
      tokenSymbol: tokenInfo.symbol,
    })
  }

  // if multiple tokens and have local price - return local amount
  if (!sameToken && haveLocalPrice) {
    return t('localAmount', {
      localAmount: localAmount.plus(localFeeAmount),
      localCurrencySymbol,
    })
  }

  // otherwise there are multiple tokens with no local prices so return multiple token amounts
  return t('reviewTransaction.totalAmount_mutlipleTokens_noFiatPrice', {
    amount1: formatValueToDisplay(tokenAmount),
    symbol1: tokenInfo.symbol,
    amount2: formatValueToDisplay(tokenFeeAmount),
    symbol2: feeTokenInfo.symbol,
  })
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
    [localFeeAmount, tokenFeeAmount, feeTokenInfo]
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
        // TODO remove fromModal from `sendPayment`
        false,
        getSerializablePreparedTransaction(preparedTransaction)
      )
    )
  }

  // Should never happen
  if (!tokenInfo) {
    Logger.error(TAG, `tokenInfo is missing`)
  }

  return (
    <ReviewTransaction
      title="Review Send"
      headerAction={<BackButton eventName={SendEvents.send_confirm_back} />}
    >
      <ReviewContent>
        <ReviewSummary>
          {tokenInfo && (
            <ReviewSummaryItem
              testID="SendConfirmationToken"
              header="Sending"
              icon={<TokenIcon token={tokenInfo} />}
              title={t('tokenAmount', {
                tokenAmount: formatValueToDisplay(tokenAmount),
                tokenSymbol: tokenInfo.symbol ?? '',
              })}
              subtitle={t('localAmount', {
                localAmount: formatValueToDisplay(localAmount ?? new BigNumber(0)),
                localCurrencySymbol,
                context: localAmount ? undefined : 'noFiatPrice',
              })}
            />
          )}

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
                i18nKey={'tokenAndLocalAmount_oneToken'}
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
              <TotalPlusFees
                tokenInfo={tokenInfo}
                feeTokenInfo={feeTokenInfo}
                tokenAmount={tokenAmount}
                localAmount={localAmount}
                tokenFeeAmount={maxFeeAmount}
                localFeeAmount={localFeeAmount}
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

const styles = StyleSheet.create({
  totalPlusFeesLocalAmount: {
    color: Colors.contentSecondary,
  },
})
