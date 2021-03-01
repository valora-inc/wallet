import { StackScreenProps } from '@react-navigation/stack'
import crypto from 'crypto'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import InAppBrowser from 'src/components/InAppBrowser'
import { CASH_IN_SUCCESS_DEEPLINK, DEFAULT_TESTNET, VALORA_KEY_DISTRIBUTER_URL } from 'src/config'
import { ProviderApiKeys } from 'src/fiatExchanges/ProviderOptionsScreen'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const MOONPAY_URI = networkConfig.moonpayWidgetUrl

export const moonPayOptions = () => ({
  ...emptyHeader,
  headerTitle: (MOONPAY_URI.match(/(?!(w+)\.)(-|\w)*(?:\w+\.)+\w+/) || [])[0],
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
})

type RouteProps = StackScreenProps<StackParamList, Screens.MoonPayScreen>
type Props = RouteProps

function MoonPayScreen({ route }: Props) {
  const [apiKeys, setApiKeys] = useState<ProviderApiKeys>()
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)

  useEffect(() => {
    const getApiKey = async () => {
      const response = await fetch(VALORA_KEY_DISTRIBUTER_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'moonpay',
          env: DEFAULT_TESTNET,
        }),
      })

      return response.json()
    }

    getApiKey()
      .then(setApiKeys)
      .catch(() => showError(ErrorMessages.FIREBASE_FAILED))
  }, [])

  const uri = `
  ${MOONPAY_URI}
    ?apiKey=${apiKeys?.publicKey}
    &currencyCode=${currencyToBuy}
    &walletAddress=${account}
    &baseCurrencyCode=${currencyCode}
    &baseCurrencyAmount=${localAmount}
    &redirectURL=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
    `.replace(/\s+/g, '')

  const signature = !apiKeys?.privateKey
    ? ''
    : crypto
        .createHmac('sha256', apiKeys.privateKey)
        .update(new URL(uri).search)
        .digest('base64')

  const urlWithSignature = `${uri}&signature=${encodeURIComponent(signature)}`

  return <InAppBrowser uri={urlWithSignature} isLoading={!apiKeys} onCancel={navigateBack} />
}

export default MoonPayScreen
