import { QuoteRequestQuery } from '@fiatconnect/fiatconnect-types'
import { CICOFlow } from 'src/fiatExchanges/utils'
import networkConfig from 'src/geth/networkConfig'
import Logger from '../utils/Logger'
const TAG = 'FIATCONNECT'

export interface FiatConnectClientConfig {
  // todo eventually: get from SDK (once it is published to NPM)
  baseUrl: string
  providerName: string
  iconUrl: string
}

/**
 * Get a list of FiatConnect providers.
 *
 * Queries a cloud function for static information about FiatConnect providers.
 */
export async function getFiatConnectProviders(
  address: string,
  providerList?: string
): Promise<FiatConnectClientConfig[]> {
  const response = await fetch(
    `${networkConfig.getFiatConnectProvidersUrl}?address=${address}&providers=${providerList}`
  )
  if (!response.ok) {
    Logger.error(
      TAG,
      `Failure response fetching FiatConnect providers: ${response} , returning empty list`
    )
    return []
  }
  const { providers } = await response.json()
  return providers
}

type QuotesInput = QuoteRequestQuery & {
  providers: string
  flow: CICOFlow
}

export async function getFiatConnectQuotes(params: QuotesInput) {
  const { flow, ...otherParams } = params

  const queryParams = new URLSearchParams({
    ...otherParams,
    quoteType: flow === CICOFlow.CashIn ? 'in' : 'out',
  }).toString()
  const response = await fetch(`${networkConfig.getFiatConnectQuotesUrl}?${queryParams}`)
  if (!response.ok) {
    const { errorMessage } = await response.json()
    Logger.error(
      TAG,
      `Failure response fetching FiatConnect quotes: ${errorMessage} , returning empty list`
    )
    return []
  }
  const { quotes } = await response.json()
  return quotes
}
