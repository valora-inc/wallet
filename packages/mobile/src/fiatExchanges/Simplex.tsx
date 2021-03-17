import { default as DeviceInfo } from 'react-native-device-info'
import { CASH_IN_FAILURE_DEEPLINK, CASH_IN_SUCCESS_DEEPLINK, CurrencyCode } from 'src/config'
import { fetchUserAccountCreationData } from 'src/fiatExchanges/utils'
import networkConfig from 'src/geth/networkConfig'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import Logger from 'src/utils/Logger'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'SimplexAPI'

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

const Simplex = {
  fetchQuote: async (
    userAddress: string,
    ipAddress: string,
    currencyToBuy: CurrencyCode,
    fiatCurrency: LocalCurrencyCode,
    fiatAmount: number
  ) => {
    try {
      const response = await Simplex.post('/wallet/merchant/v2/quote', {
        end_user_id: userAddress,
        digital_currency: currencyToBuy,
        fiat_currency: fiatCurrency,
        requested_currency: currencyToBuy,
        requested_amount: fiatAmount,
        wallet_id: 'valorapp',
        client_ip: ipAddress,
        payment_methods: ['credit_card'],
      })

      const simplexQuote: SimplexQuote = await response.json()
      return simplexQuote
    } catch (error) {
      Logger.error(TAG, error.message)
    }
  },
  fetchPaymentRequest: async (
    userAddress: string,
    phoneNumber: string | null,
    phoneNumberVerified: boolean,
    simplexQuote: SimplexQuote,
    currentIpAddress: string
  ) => {
    const paymentId = uuidv4()
    const orderId = uuidv4()

    const accountCreationData = await fetchUserAccountCreationData(currentIpAddress)

    const response = await Simplex.post('/wallet/merchant/v2/payments/partner/data', {
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
    })

    const simplexPaymentRequestResponse: SimplexPaymentRequestResponse = await response.json()
    if (simplexPaymentRequestResponse.is_kyc_update_required === undefined) {
      throw Error('Simplex payment request failed')
    }

    return { paymentId, orderId }
  },
  generateCheckoutForm: (paymentId: string) => `
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
  `,
  post: async (path: string, body: any) =>
    fetch(`${networkConfig.simplexUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${networkConfig.simplexApiKey}`,
      },
      body: JSON.stringify(body),
    }),
}

export default Simplex
