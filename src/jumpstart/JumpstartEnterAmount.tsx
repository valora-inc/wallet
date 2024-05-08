import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import { createJumpstartLink } from 'src/firebase/dynamicLinks'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { jumpstartSendStatusSelector } from 'src/jumpstart/selectors'
import { depositTransactionFlowStarted } from 'src/jumpstart/slice'
import { usePrepareJumpstartTransactions } from 'src/jumpstart/usePrepareJumpstartTransactions'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import EnterAmount, { ProceedArgs, SendProceed } from 'src/send/EnterAmount'
import { AmountEnteredIn } from 'src/send/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { tokenAmountInSmallestUnit } from 'src/tokens/saga'
import { jumpstartSendTokensSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const TAG = 'JumpstartEnterAmount'

function JumpstartEnterAmount() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [sendAmountExceedsThreshold, setSendAmountExceedsThreshold] = useState(false)

  const jumpstartSendThreshold = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG]
  ).maxAllowedSendAmountUsd
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const maxSendAmountLocalCurrency = convertDollarsToLocalAmount(
    jumpstartSendThreshold,
    usdToLocalRate
  )
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const locale = useSelector(currentLanguageSelector)
  const jumpstartSendStatus = useSelector(jumpstartSendStatusSelector)
  const walletAddress = useSelector(walletAddressSelector)
  const tokens = useSelector(jumpstartSendTokensSelector)

  const jumpstartLink = useMemo(() => {
    const privateKey = generatePrivateKey()
    const publicKey = privateKeyToAccount(privateKey).address
    return {
      publicKey,
      privateKey,
    }
  }, [])

  useEffect(() => {
    if (jumpstartLink.privateKey) {
      dispatch(depositTransactionFlowStarted())
    }
  }, [jumpstartLink.privateKey])

  const handleProceed = useAsyncCallback(
    async ({ tokenAmount, token, amountEnteredIn }: ProceedArgs) => {
      const link = await createJumpstartLink(jumpstartLink.privateKey, token.networkId)
      return {
        link,
        parsedAmount: tokenAmount,
        token,
        amountEnteredIn,
      }
    },
    {
      onSuccess: ({
        link,
        parsedAmount,
        token,
        amountEnteredIn,
      }: {
        link: string
        parsedAmount: BigNumber
        token: TokenBalance
        amountEnteredIn: AmountEnteredIn
      }) => {
        if (prepareJumpstartTransactions.result?.type !== 'possible') {
          // should never happen
          Logger.error(
            TAG,
            'No prepared transactions found when trying to proceed with jumpstart send'
          )
          return
        }

        navigate(Screens.JumpstartSendConfirmation, {
          link,
          sendAmount: parsedAmount.toString(),
          tokenId: token.tokenId,
          serializablePreparedTransactions: getSerializablePreparedTransactions(
            prepareJumpstartTransactions.result.transactions
          ),
        })

        ValoraAnalytics.track(JumpstartEvents.jumpstart_send_amount_continue, {
          localCurrency: localCurrencyCode,
          localCurrencyExchangeRate: usdToLocalRate,
          tokenSymbol: token.symbol,
          tokenAmount: parsedAmount.toString(),
          amountInUsd: parsedAmount.multipliedBy(token.priceUsd ?? 0).toFixed(2),
          tokenId: token.tokenId,
          networkId: token.networkId,
          amountEnteredIn,
        })
      },
      onError: (error) => {
        Logger.error(TAG, 'Error while generating jumpstart dynamic link', error)
      },
    }
  )

  const prepareJumpstartTransactions = usePrepareJumpstartTransactions()

  const handleRefreshPreparedTransactions = (
    userInputAmount: BigNumber,
    token: TokenBalance,
    feeCurrencies: TokenBalance[]
  ) => {
    if (!walletAddress) {
      Logger.error(TAG, 'Wallet address not set. Cannot refresh prepared transactions.')
      return
    }

    const sendTokenAmountInSmallestUnit = tokenAmountInSmallestUnit(userInputAmount, token.decimals)
    const sendAmountUsd = userInputAmount.multipliedBy(token.priceUsd ?? 0)
    const sendAmountExceedsMax = sendAmountUsd.isGreaterThan(jumpstartSendThreshold)
    setSendAmountExceedsThreshold(sendAmountExceedsMax)
    if (sendAmountExceedsMax) {
      ValoraAnalytics.track(JumpstartEvents.jumpstart_send_amount_exceeds_threshold, {
        amountInUsd: sendAmountUsd.toFixed(2),
        tokenId: token.tokenId,
        thresholdUsd: jumpstartSendThreshold,
        networkId: token.networkId,
      })
    }

    return prepareJumpstartTransactions.execute({
      sendTokenAmountInSmallestUnit: new BigNumber(sendTokenAmountInSmallestUnit),
      token,
      walletAddress,
      feeCurrencies,
      publicKey: jumpstartLink.publicKey,
    })
  }

  // add checks for the jumpstartSendStatus here to safeguard against the user
  // navigating back to this screen to initiate another transaction with the
  // same link while the previous one is in progress or successful
  const disableProceed =
    sendAmountExceedsThreshold ||
    jumpstartSendStatus === 'success' ||
    jumpstartSendStatus === 'loading'

  return (
    <EnterAmount
      tokens={tokens}
      prepareTransactionsResult={prepareJumpstartTransactions.result}
      onClearPreparedTransactions={prepareJumpstartTransactions.reset}
      onRefreshPreparedTransactions={handleRefreshPreparedTransactions}
      prepareTransactionError={prepareJumpstartTransactions.error}
      onPressProceed={handleProceed.execute}
      disableProceed={disableProceed}
      ProceedComponent={SendProceed}
    >
      {sendAmountExceedsThreshold && (
        <InLineNotification
          variant={NotificationVariant.Warning}
          title={t('jumpstartEnterAmountScreen.maxAmountWarning.title', {
            amountInLocalCurrency: maxSendAmountLocalCurrency,
            formatParams: {
              amountInLocalCurrency: { currency: localCurrencyCode, locale },
            },
          })}
          description={t('jumpstartEnterAmountScreen.maxAmountWarning.description')}
        />
      )}
    </EnterAmount>
  )
}

export default JumpstartEnterAmount
