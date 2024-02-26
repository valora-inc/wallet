import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import EnterAmount from 'src/send/EnterAmount'
import { lastUsedTokenIdSelector } from 'src/send/selectors'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import { COMMENT_PLACEHOLDER_FOR_FEE_ESTIMATE } from 'src/send/utils'
import { tokensWithNonZeroBalanceAndShowZeroBalanceSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { convertTokenToLocalAmount, getSupportedNetworkIdsForSend } from 'src/tokens/utils'
import Logger from 'src/utils/Logger'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.SendEnterAmount>

const TAG = 'SendEnterAmount'

function SendEnterAmount({ route }: Props) {
  const { defaultTokenIdOverride, origin, recipient, isFromScan, forceTokenId } = route.params
  const supportedNetworkIds = getSupportedNetworkIdsForSend()
  const tokens = useSelector((state) =>
    tokensWithNonZeroBalanceAndShowZeroBalanceSelector(state, supportedNetworkIds)
  )
  const lastUsedTokenId = useSelector(lastUsedTokenIdSelector)

  const defaultToken = useMemo(() => {
    const defaultToken = tokens.find((token) => token.tokenId === defaultTokenIdOverride)
    const lastUsedToken = tokens.find((token) => token.tokenId === lastUsedTokenId)

    return defaultToken ?? lastUsedToken ?? tokens[0]
  }, [tokens, defaultTokenIdOverride, lastUsedTokenId])

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)

  const handleReviewSend = (parsedAmount: BigNumber, token: TokenBalance) => {
    if (!prepareTransactionsResult || prepareTransactionsResult.type !== 'possible') {
      // should never happen because button is disabled if send is not possible
      throw new Error('No prepared transactions found')
    }

    const sendAmountInLocalCurrency = convertTokenToLocalAmount({
      tokenAmount: parsedAmount,
      tokenInfo: token,
      usdToLocalRate: localCurrencyExchangeRate,
    })

    navigate(Screens.SendConfirmation, {
      origin,
      isFromScan,
      transactionData: {
        tokenId: token.tokenId,
        recipient,
        inputAmount: parsedAmount,
        amountIsInLocalCurrency: false,
        tokenAddress: token.address!,
        tokenAmount: parsedAmount,
      },
      preparedTransaction: getSerializablePreparedTransaction(
        prepareTransactionsResult.transactions[0]
      ),
      feeAmount: maxFeeAmount?.toString(),
      feeTokenId: feeCurrency?.tokenId,
    })
    ValoraAnalytics.track(SendEvents.send_amount_continue, {
      origin,
      isScan: isFromScan,
      recipientType: recipient.recipientType,
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      localCurrencyAmount: sendAmountInLocalCurrency?.toString() ?? null,
      underlyingTokenAddress: token.address,
      underlyingTokenSymbol: token.symbol,
      underlyingAmount: parsedAmount.toString(),
      amountInUsd: null,
      tokenId: token.tokenId,
      networkId: token.networkId,
    })
  }

  const {
    prepareTransactionsResult,
    refreshPreparedTransactions,
    clearPreparedTransactions,
    prepareTransactionError,
  } = usePrepareSendTransactions()
  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)

  const walletAddress = useSelector(walletAddressSelector)

  const handlRefreshPreparedTransactions = (
    amount: BigNumber,
    token: TokenBalance,
    feeCurrencies: TokenBalance[]
  ) => {
    if (!walletAddress) {
      Logger.error(TAG, 'Wallet address not set. Cannot refresh prepared transactions.')
      return
    }

    return refreshPreparedTransactions({
      amount,
      token,
      recipientAddress: recipient.address,
      walletAddress,
      feeCurrencies,
      comment: COMMENT_PLACEHOLDER_FOR_FEE_ESTIMATE,
    })
  }

  return (
    <EnterAmount
      tokens={tokens}
      defaultToken={defaultToken}
      prepareTransactionsResult={prepareTransactionsResult}
      onClearPreparedTransactions={clearPreparedTransactions}
      onRefreshPreparedTransactions={handlRefreshPreparedTransactions}
      prepareTransactionError={prepareTransactionError}
      tokenSelectionDisabled={!!forceTokenId}
      onPressProceed={handleReviewSend}
    />
  )
}

export default SendEnterAmount
