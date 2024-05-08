import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import EnterAmount, { ProceedArgs, SendProceed } from 'src/send/EnterAmount'
import { lastUsedTokenIdSelector } from 'src/send/selectors'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import { COMMENT_PLACEHOLDER_FOR_FEE_ESTIMATE } from 'src/send/utils'
import { sortedTokensWithBalanceOrShowZeroBalanceSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSend } from 'src/tokens/utils'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.SendEnterAmount>

const TAG = 'SendEnterAmount'

function SendEnterAmount({ route }: Props) {
  const { defaultTokenIdOverride, origin, recipient, isFromScan, forceTokenId } = route.params
  const supportedNetworkIds = getSupportedNetworkIdsForSend()
  // explicitly allow zero state tokens to be shown for exploration purposes for
  // new users with no balance
  const tokens = useSelector((state) =>
    sortedTokensWithBalanceOrShowZeroBalanceSelector(state, supportedNetworkIds)
  )
  const lastUsedTokenId = useSelector(lastUsedTokenIdSelector)

  const defaultToken = useMemo(() => {
    const defaultToken = tokens.find((token) => token.tokenId === defaultTokenIdOverride)
    const lastUsedToken = tokens.find((token) => token.tokenId === lastUsedTokenId)

    return defaultToken ?? lastUsedToken ?? tokens[0]
  }, [tokens, defaultTokenIdOverride, lastUsedTokenId])

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)

  const handleReviewSend = ({ tokenAmount, localAmount, token, amountEnteredIn }: ProceedArgs) => {
    if (!prepareTransactionsResult || prepareTransactionsResult.type !== 'possible') {
      // should never happen because button is disabled if send is not possible
      throw new Error('No prepared transactions found')
    }

    navigate(Screens.SendConfirmation, {
      origin,
      isFromScan,
      transactionData: {
        tokenId: token.tokenId,
        recipient,
        inputAmount: tokenAmount,
        amountIsInLocalCurrency: false,
        tokenAddress: token.address!,
        tokenAmount,
      },
    })
    ValoraAnalytics.track(SendEvents.send_amount_continue, {
      origin,
      isScan: isFromScan,
      recipientType: recipient.recipientType,
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      localCurrencyAmount: localAmount?.toFixed(2) ?? null,
      underlyingTokenAddress: token.address,
      underlyingTokenSymbol: token.symbol,
      underlyingAmount: tokenAmount.toString(),
      amountInUsd: tokenAmount.multipliedBy(token.priceUsd ?? 0).toFixed(2),
      amountEnteredIn,
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

  const walletAddress = useSelector(walletAddressSelector)

  const handleRefreshPreparedTransactions = (
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
      onRefreshPreparedTransactions={handleRefreshPreparedTransactions}
      prepareTransactionError={prepareTransactionError}
      tokenSelectionDisabled={!!forceTokenId}
      onPressProceed={handleReviewSend}
      ProceedComponent={SendProceed}
    />
  )
}

export default SendEnterAmount
