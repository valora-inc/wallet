import { default as DeviceInfo } from 'react-native-device-info'
import {
  CASH_IN_FAILURE_DEEPLINK,
  CASH_IN_SUCCESS_DEEPLINK,
  CurrencyCode,
  DEFAULT_TESTNET,
  MOONPAY_API_KEY,
  PROVIDER_URL_COMPOSER_PROD,
  PROVIDER_URL_COMPOSER_STAGING,
  USER_DATA_URL,
} from 'src/config'
import { Providers } from 'src/fiatExchanges/ProviderOptionsScreen'
import { providerAvailability } from 'src/flags'
import networkConfig from 'src/geth/networkConfig'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface RequestData {
  address: string | null
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: number
}

interface IpAddressData {
  alpha2: string
  alpha3: string
  state: string
  ipAddress: string
}

export interface UserLocation {
  country: string | null
  state: string | null
}

export interface UserAccountCreationData {
  ipAddress: string
  timestamp: string
  userAgent: string
}

export interface SimplexQuote {
  user_id: string
  quote_id: string
  wallet_id: string
  digital_money: {
    currency: string
    amount: number
  }
  fiat_money: {
    currency: string
    base_amount: number
    total_amount: number
  }
  valid_until: string
  supported_digital_currencies: string[]
}

export interface SimplexPaymentRequestResponse {
  is_kyc_update_required: boolean
}

export const fetchProviderWidgetUrl = async (provider: Providers, requestData: RequestData) => {
  const response = await fetch(
    DEFAULT_TESTNET === 'mainnet' ? PROVIDER_URL_COMPOSER_PROD : PROVIDER_URL_COMPOSER_STAGING,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestData,
        provider,
      }),
    }
  )

  return response.json()
}

export const fetchLocationFromIpAddress = async () => {
  const ipAddressFetchResponse = await fetch(
    `https://api.moonpay.com/v4/ip_address?apiKey=${MOONPAY_API_KEY}`
  )
  const ipAddressObj: IpAddressData = await ipAddressFetchResponse.json()
  return ipAddressObj
}

export const fetchSimplexQuote = async (
  userAddress: string,
  ipAddress: string,
  currencyToBuy: CurrencyCode,
  fiatCurrency: LocalCurrencyCode,
  fiatAmount: number
) => {
  const response = await fetch(`${networkConfig.simplexUrl}/wallet/merchant/v2/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${networkConfig.simplexApiKey}`,
    },
    body: JSON.stringify({
      end_user_id: userAddress,
      digital_currency: currencyToBuy,
      fiat_currency: fiatCurrency,
      requested_currency: fiatCurrency,
      requested_amount: fiatAmount,
      wallet_id: 'valorapp',
      client_ip: ipAddress,
      payment_methods: ['credit_card'],
    }),
  })

  const simplexQuote: SimplexQuote = await response.json()
  return simplexQuote
}

export const createUuidv4 = () =>
  (String(1e7) + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    // tslint:disable-next-line
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  )

const fetchUserAccountCreationData = async (deviceId: string) => {
  const response = await fetch(USER_DATA_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deviceId,
    }),
  })

  const userAccountCreationData: UserAccountCreationData = await response.json()
  return userAccountCreationData
}

export const fetchSimplexPaymentRequest = async (
  userAddress: string,
  phoneNumber: string | null,
  phoneNumberVerified: boolean,
  simplexQuote: SimplexQuote,
  currentIpAddress: string
) => {
  const paymentId = createUuidv4()
  const orderId = createUuidv4()

  let accountCreationData: UserAccountCreationData
  try {
    accountCreationData = await fetchUserAccountCreationData(DeviceInfo.getUniqueId())
    if (accountCreationData.ipAddress === '') {
      throw Error('No account creation data currently in database')
    }
  } catch (error) {
    // If account creation data fetch fails or there is no data stored, default to current device info
    accountCreationData = {
      ipAddress: currentIpAddress,
      // Using new Date because DeviceInfo.getFirstInstallTime returns incorrect date
      timestamp: new Date().toISOString(),
      userAgent: DeviceInfo.getUserAgentSync(),
    }
  }

  const response = await fetch(
    `${networkConfig.simplexUrl}/wallet/merchant/v2/payments/partner/data`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${networkConfig.simplexApiKey}`,
      },
      body: JSON.stringify({
        account_details: {
          app_provider_id: 'valorapp',
          app_end_user_id: userAddress,
          app_version_id: DeviceInfo.getVersion(),
          app_install_date: accountCreationData.timestamp,
          email: '',
          phone: phoneNumber || '',
          verified_details: [
            // 'email', Currently no way to verify email in Valora
            phoneNumberVerified && 'phone',
          ].filter((_) => !!_),
          signup_login: {
            ip: accountCreationData.ipAddress,
            user_agent: accountCreationData.userAgent,
            timestamp: accountCreationData.timestamp,
          },
        },
        transaction_details: {
          payment_details: {
            quote_id: simplexQuote.quote_id,
            payment_id: paymentId,
            order_id: orderId,
            destination_wallet: {
              currency: simplexQuote.digital_money.currency,
              address: userAddress,
              tag: '',
            },
            original_http_ref_url: 'https://valoraapp.com',
          },
        },
      }),
    }
  )

  const simplexPaymentRequestResponse: SimplexPaymentRequestResponse = await response.json()
  if (simplexPaymentRequestResponse.is_kyc_update_required === undefined) {
    throw Error('Simplex payment request failed')
  }

  return { paymentId, orderId }
}

export const generateSimplexCheckoutForm = (paymentId: string) => `
  <html>
    <body>
      <form id="payment_form" action="${networkConfig.simplexUrl}/payments/new" method="post">
        <input type="hidden" name="version" value="1">
        <input type="hidden" name="partner" value="valorapp">
        <input type="hidden" name="payment_flow_type" value="wallet">
        <input type="hidden" name="return_url_success" value="${CASH_IN_SUCCESS_DEEPLINK}">
        <input type="hidden" name="return_url_fail" value="${CASH_IN_FAILURE_DEEPLINK}">
        <input type="hidden" name="payment_id" value="${paymentId}">
      </form>
      <script type="text/javascript">
        document.forms["payment_form"].submit();
      </script>
    </body>
  </html>
`

export const isExpectedUrl = (fetchedUrl: string, providerUrl: string) =>
  fetchedUrl.startsWith(providerUrl)

export const openMoonpay = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyCode
) => {
  navigate(Screens.MoonPayScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openRamp = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyCode
) => {
  navigate(Screens.RampScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openTransak = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyCode
) => {
  navigate(Screens.TransakScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

type ProviderAvailability = typeof providerAvailability
type SpecificProviderAvailability = { [K in keyof ProviderAvailability]: boolean }

type Entries<T> = Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>

export function getProviderAvailability(
  userLocation: UserLocation | undefined
): SpecificProviderAvailability {
  const countryCodeAlpha2 = userLocation?.country ?? null
  const stateCode = userLocation?.state ?? null

  // tslint:disable-next-line: no-object-literal-type-assertion
  const features = {} as SpecificProviderAvailability
  for (const [key, value] of Object.entries(providerAvailability) as Entries<
    ProviderAvailability
  >) {
    if (!countryCodeAlpha2) {
      features[key] = false
    } else {
      if (countryCodeAlpha2 === 'US' && (value as any)[countryCodeAlpha2] !== true) {
        features[key] = stateCode ? (value as any)[countryCodeAlpha2][stateCode] ?? false : false
      } else {
        features[key] = (value as any)[countryCodeAlpha2] ?? false
      }
    }
  }
  return features
}
