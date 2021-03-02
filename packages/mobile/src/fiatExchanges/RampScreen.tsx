import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import InAppBrowser from 'src/components/InAppBrowser'
import { CASH_IN_SUCCESS_DEEPLINK, VALORA_KEY_DISTRIBUTER_URL, VALORA_LOGO_URL } from 'src/config'
import { ProviderApiKeys, PROVIDER_ENUM } from 'src/fiatExchanges/ProviderOptionsScreen'
import { createApiKeyPostRequestObj } from 'src/fiatExchanges/utils'
import networkConfig from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const RAMP_URI = networkConfig.rampWidgetUrl

export const rampOptions = () => ({
  ...emptyHeader,
  headerTitle: (RAMP_URI.match(/(?!(w+)\.)(-|\w)*(?:\w+\.)+\w+/) || [])[0],
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
})

type RouteProps = StackScreenProps<StackParamList, Screens.RampScreen>
type Props = RouteProps

function RampScreen({ route }: Props) {
  const [apiKeys, setApiKeys] = useState<ProviderApiKeys>()
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)

  useEffect(() => {
    const postRequestObject = createApiKeyPostRequestObj(PROVIDER_ENUM.RAMP)
    const getApiKey = async () => {
      const response = await fetch(VALORA_KEY_DISTRIBUTER_URL, postRequestObject)
      return response.json()
    }

    getApiKey()
      .then(setApiKeys)
      .catch(() => showError(ErrorMessages.FIREBASE_FAILED))
  }, [])

  const uri = `
    ${RAMP_URI}
      ?hostApiKey=${apiKeys?.publicKey}
      &userAddress=${account}
      &swapAsset=${currencyToBuy}
      &hostAppName=Valora
      &hostLogoUrl=${VALORA_LOGO_URL}
      &fiatCurrency=${currencyCode}
      &fiatValue=${localAmount}
      &finalUrl=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
    `.replace(/\s+/g, '')

  return <InAppBrowser uri={uri} isLoading={!apiKeys} onCancel={navigateBack} />
}

export default RampScreen
