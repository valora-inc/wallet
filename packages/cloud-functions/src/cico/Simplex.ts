import * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import { UserDeviceInfo } from '.'
import {
  CASH_IN_FAILURE_DEEPLINK,
  CASH_IN_SUCCESS_DEEPLINK,
  CurrencyCode,
  LocalCurrencyCode,
  SIMPLEX_DATA,
} from '../config'
import { getFirebaseAdminCreds } from './utils'
const { BigQuery } = require('@google-cloud/bigquery')
const fetch = require('node-fetch')

const gcloudProject = process.env.GCLOUD_PROJECT
const bigQueryProjectId = 'celo-testnet-production'
const bigQueryDataset =
  gcloudProject === 'celo-mobile-alfajores' ? 'mobile_wallet_dev' : 'mobile_wallet_production'
const bigQuery = new BigQuery({ projectId: `${bigQueryProjectId}` })

admin.initializeApp({
  credential: getFirebaseAdminCreds(admin),
  databaseURL: `https://${gcloudProject}.firebaseio.com`,
  projectId: gcloudProject,
})

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

export interface SimplexPaymentData {
  orderId: string
  paymentId: string
  checkoutHtml: string
}

interface UserInitData {
  ipAddress: string
  timestamp: string
  userAgent: string
}

const getUserInitData = async (
  currentIpAddress: string,
  deviceId: string,
  userAgent: string
): Promise<UserInitData> => {
  const [data] = await bigQuery.query(`
    SELECT context_ip, device_info_user_agent, timestamp
    FROM ${bigQueryProjectId}.${bigQueryDataset}.app_launched
    WHERE user_address = (
        SELECT user_address
        FROM ${bigQueryProjectId}.${bigQueryDataset}.app_launched
        WHERE device_info_unique_id= "${deviceId}"
        AND user_address IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 1
    )
    ORDER BY timestamp ASC
    LIMIT 1
  `)

  if (!data.length) {
    return {
      ipAddress: currentIpAddress,
      timestamp: new Date().toISOString(),
      userAgent,
    }
  }

  const { context_ip, device_info_user_agent, timestamp } = data[0]

  const userInitData = {
    ipAddress: context_ip,
    timestamp: timestamp.value,
    userAgent: device_info_user_agent,
  }

  return userInitData
}

const getOrCreateUuid = async (userAddress: string) => {
  let simplexId = await admin
    .database()
    .ref(`registrations/${userAddress}/simplexId`)
    .once('value')
    .then((snapshot) => snapshot.val())

  if (simplexId) {
    return simplexId
  }

  simplexId = uuidv4()
  await admin
    .database()
    .ref(`registrations/${userAddress}`)
    .update({ simplexId })

  return simplexId
}

const Simplex = {
  fetchQuote: async (
    userAddress: string,
    ipAddress: string,
    currencyToBuy: CurrencyCode,
    fiatCurrency: LocalCurrencyCode,
    amount: number,
    amountIsFiat: boolean
  ) => {
    const userUuid = await getOrCreateUuid(userAddress)

    const response = await Simplex.post('/wallet/merchant/v2/quote', {
      end_user_id: userUuid,
      digital_currency: currencyToBuy,
      fiat_currency: fiatCurrency,
      requested_currency: amountIsFiat ? fiatCurrency : currencyToBuy,
      requested_amount: amount,
      wallet_id: 'valorapp',
      client_ip: ipAddress,
      payment_methods: ['credit_card'],
    })

    const simplexQuote: SimplexQuote = await response.json()
    return simplexQuote
  },
  fetchPaymentRequest: async (
    userAddress: string,
    phoneNumber: string | null,
    phoneNumberVerified: boolean,
    simplexQuote: SimplexQuote,
    currentIpAddress: string,
    deviceInfo: UserDeviceInfo
  ) => {
    const paymentId = uuidv4()
    const orderId = uuidv4()

    const { id, appVersion, userAgent } = deviceInfo
    const accountCreationData = await getUserInitData(currentIpAddress, id, userAgent)
    const userUuid = await getOrCreateUuid(userAddress)

    const response = await Simplex.post('/wallet/merchant/v2/payments/partner/data', {
      account_details: {
        app_provider_id: 'valorapp',
        app_end_user_id: userUuid,
        app_version_id: appVersion,
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

    const checkoutHtml = Simplex.generateCheckoutForm(paymentId)
    const simplexPaymentData: SimplexPaymentData = { paymentId, orderId, checkoutHtml }
    return simplexPaymentData
  },
  generateCheckoutForm: (paymentId: string) => `
    <html>
      <body>
        <form id="payment_form" action="${SIMPLEX_DATA.checkout_url}/payments/new" method="post">
          <input type="hidden" name="version" value="1">
          <input type="hidden" name="partner" value="valorapp">
          <input type="hidden" name="payment_flow_type" value="wallet">
          <input type="hidden" name="return_url_success" value="${CASH_IN_SUCCESS_DEEPLINK}/simplex">
          <input type="hidden" name="return_url_fail" value="${CASH_IN_FAILURE_DEEPLINK}/simplex">
          <input type="hidden" name="payment_id" value="${paymentId}">
        </form>
        <script type="text/javascript">
          document.forms["payment_form"].submit();
        </script>
      </body>
    </html>
  `,
  post: async (path: string, body: any) => {
    return fetch(`${SIMPLEX_DATA.api_url}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `ApiKey ${SIMPLEX_DATA.api_key}`,
      },
      body: JSON.stringify(body),
    })
  },
}

export default Simplex
