import crypto from 'crypto'
import {
  CASH_IN_SUCCESS_DEEPLINK,
  CASH_IN_SUCCESS_URL,
  MOONPAY_DATA,
  RAMP_DATA,
  TRANSAK_DATA,
  VALORA_LOGO_URL,
  XANPOOL_DATA,
} from '../config'
import { ProviderRequestData } from './fetchProviders'
import { Providers } from './Providers'
import { findContinguousSpaces } from './utils'
const URL = require('url').URL

export const composeProviderUrl = (provider: Providers, requestData: ProviderRequestData) => {
  const { walletAddress, digitalAsset, fiatCurrency, fiatAmount } = requestData
  const cashInSuccessDeepLink = `${CASH_IN_SUCCESS_DEEPLINK}/${provider}`

  if (provider === Providers.Moonpay) {
    const unsignedUrl = `
      ${MOONPAY_DATA.widget_url}
        ?apiKey=${MOONPAY_DATA.public_key}
        &currencyCode=${digitalAsset}
        &walletAddress=${walletAddress}
        &baseCurrencyCode=${fiatCurrency}
        &baseCurrencyAmount=${fiatAmount}
        &redirectURL=${encodeURIComponent(cashInSuccessDeepLink)}
        `.replace(findContinguousSpaces, '')

    const signature = crypto
      .createHmac('sha256', MOONPAY_DATA.private_key)
      .update(new URL(unsignedUrl).search)
      .digest('base64')

    return `${unsignedUrl}&signature=${encodeURIComponent(signature)}`
  }

  if (provider === Providers.Ramp) {
    return `
      ${RAMP_DATA.widget_url}
        ?hostApiKey=${RAMP_DATA.public_key}
        &userAddress=${walletAddress}
        &swapAsset=${digitalAsset}
        &hostAppName=Valora
        &hostLogoUrl=${VALORA_LOGO_URL}
        &fiatCurrency=${fiatCurrency}
        &fiatValue=${fiatAmount}
        &finalUrl=${encodeURIComponent(cashInSuccessDeepLink)}
        &webhookStatusUrl=${RAMP_DATA.webhook_url}
      `.replace(findContinguousSpaces, '')
  }

  if (provider === Providers.Transak) {
    // Transak doesn't support deeplinks so redirecting to URL instead
    return `
      ${TRANSAK_DATA.widget_url}
        ?apiKey=${TRANSAK_DATA.public_key}
        &hostURL=${encodeURIComponent('https://www.valoraapp.com')}
        &walletAddress=${walletAddress}
        &disableWalletAddressForm=true
        &cryptoCurrencyCode=${digitalAsset}
        &fiatCurrency=${fiatCurrency}
        &defaultFiatAmount=${fiatAmount}
        &redirectURL=${encodeURIComponent(CASH_IN_SUCCESS_URL)}
        &hideMenu=true
      `.replace(findContinguousSpaces, '')
  }

  if (provider === Providers.Xanpool) {
    return `
      ${XANPOOL_DATA.widget_url}
        ?apiKey=${XANPOOL_DATA.public_key}
        &wallet=${walletAddress}
        &cryptoCurrency=${digitalAsset}
        ${
          XANPOOL_DATA.supported_currencies.includes(fiatCurrency)
            ? `&currency=${fiatCurrency}`
            : ''
        }
        &fiat=${fiatAmount}
        &redirectUrl=${cashInSuccessDeepLink}
      `.replace(findContinguousSpaces, '')
  }
}

const unsignedUrl = `
${MOONPAY_DATA.widget_url}
  ?apiKey=${'pk_test_EDT0SRJUlsJezJUFGaVZIr8LuaTsF5NO'}
  &currencyCode=${'ETH'}
  &walletAddress=${'0xf0c84539e80cb10b197e20fbd4f85e0d93e5dc03'}
  &baseCurrencyCode=${'USD'}
  &baseCurrencyAmount=${100}
  `.replace(findContinguousSpaces, '')

const signature = crypto
  .createHmac('sha256', 'sk_test_f4eX8rbao56sR5gqBe34Nhco1DOmuf2b')
  .update(new URL(unsignedUrl).search)
  .digest('base64')

console.log(`${unsignedUrl}&signature=${encodeURIComponent(signature)}`)
