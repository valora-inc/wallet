import BigNumber from 'bignumber.js'
import React, { RefObject, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import AddAssetsBottomSheet, { AddAssetsAction } from 'src/components/AddAssetsBottomSheet'
import { BottomSheetModalRefType } from 'src/components/BottomSheet'
import { CICOFlow, fetchExchanges } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { NETWORK_NAMES } from 'src/shared/conts'
import { useCashInTokens, useSwappableTokens, useTokenToLocalAmount } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { TokenActionName } from 'src/tokens/types'
import { getTokenAnalyticsProps } from 'src/tokens/utils'

export default function EarnAddCryptoBottomSheet({
  forwardedRef,
  token,
  tokenAmount,
}: {
  forwardedRef: RefObject<BottomSheetModalRefType>
  token: TokenBalance
  tokenAmount: BigNumber
}) {
  const { t } = useTranslation()
  const { swappableFromTokens } = useSwappableTokens()
  const cashInTokens = useCashInTokens()
  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)
  const userLocation = useSelector(userLocationDataSelector)

  const showAdd = !!cashInTokens.find((tokenInfo) => tokenInfo.tokenId === token.tokenId)
  const showSwap =
    isSwapEnabled &&
    !!swappableFromTokens.find(
      (tokenInfo) => tokenInfo.networkId === token.networkId && tokenInfo.tokenId !== token.tokenId
    )
  const addAmount = {
    crypto: tokenAmount.toNumber(),
    fiat: Math.round(
      (useTokenToLocalAmount(tokenAmount, token.tokenId) || new BigNumber(0)).toNumber()
    ),
  }

  const asyncExchanges = useAsync(async () => {
    try {
      const availableExchanges = await fetchExchanges(userLocation.countryCodeAlpha2, token.tokenId)

      return availableExchanges
    } catch (error) {
      return []
    }
  }, [])
  const exchanges = asyncExchanges.result ?? []

  const actions = useMemo(() => {
    const visibleActions: AddAssetsAction[] = []
    if (showAdd) {
      visibleActions.push({
        name: TokenActionName.Add,
        details: t('earnFlow.addCryptoBottomSheet.actionDescriptions.add', {
          tokenSymbol: token.symbol,
          tokenNetwork: NETWORK_NAMES[token.networkId],
        }),
        onPress: () => {
          AppAnalytics.track(EarnEvents.earn_add_crypto_action_press, {
            action: TokenActionName.Add,
            ...getTokenAnalyticsProps(token),
          })

          navigate(Screens.SelectProvider, {
            tokenId: token.tokenId,
            flow: CICOFlow.CashIn,
            amount: addAmount,
          })
          forwardedRef.current?.dismiss()
        },
      })
    }

    visibleActions.push({
      name: TokenActionName.Transfer,
      details: t('earnFlow.addCryptoBottomSheet.actionDescriptions.transfer', {
        tokenSymbol: token.symbol,
        tokenNetwork: NETWORK_NAMES[token.networkId],
      }),
      onPress: () => {
        AppAnalytics.track(EarnEvents.earn_add_crypto_action_press, {
          action: TokenActionName.Transfer,
          ...getTokenAnalyticsProps(token),
        })

        navigate(Screens.ExchangeQR, { flow: CICOFlow.CashIn, exchanges })
        forwardedRef.current?.dismiss()
      },
    })

    if (showSwap) {
      visibleActions.push({
        name: TokenActionName.Swap,
        details: t('earnFlow.addCryptoBottomSheet.actionDescriptions.swap', {
          tokenSymbol: token.symbol,
          tokenNetwork: NETWORK_NAMES[token.networkId],
        }),
        onPress: () => {
          AppAnalytics.track(EarnEvents.earn_add_crypto_action_press, {
            action: TokenActionName.Swap,
            ...getTokenAnalyticsProps(token),
          })

          navigate(Screens.SwapScreenWithBack, { toTokenId: token.tokenId })
          forwardedRef.current?.dismiss()
        },
      })
    }

    return visibleActions
  }, [showAdd, showSwap, token, exchanges, tokenAmount])

  return (
    <AddAssetsBottomSheet
      forwardedRef={forwardedRef}
      actions={actions}
      title={t('earnFlow.addCryptoBottomSheet.title', {
        tokenSymbol: token.symbol,
        tokenNetwork: NETWORK_NAMES[token.networkId],
      })}
      description={t('earnFlow.addCryptoBottomSheet.description')}
      testId={'Earn/AddCrypto'}
    />
  )
}
