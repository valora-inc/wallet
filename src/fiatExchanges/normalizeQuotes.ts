import { QuoteResponse } from '@fiatconnect/fiatconnect-types'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  CICOFlow,
  FetchProvidersOutput,
  isSimplexQuote,
  PaymentMethod,
  SimplexQuote,
} from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

interface FiatConnectProviderInfo {
  id: string
  providerName: string
  imageUrl: string
  baseUrl: string
}

export interface NormalizedQuote {
  quote: QuoteInfo
  provider: ProviderInfo
}

export interface QuoteInfo {
  paymentMethod: PaymentMethod
  fee: number
  kycInfo: string
  timeEstimation: string
  onPress: () => void
}

export interface ProviderInfo {
  name: string
  logo: string
}

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

export function normalizeFiatConnectQuotes(
  flow: CICOFlow,
  quotes: (QuoteResponse & { provider: FiatConnectProviderInfo })[]
): NormalizedQuote[] {
  const normalizedQuotes: NormalizedQuote[] = []

  quotes.forEach((quote) => {
    if (!quote.fiatAccount.BankAccount) {
    }
    normalizedQuotes.push({
      quote: {},
    })
  })
}

export function normalizeExternalProviders(
  flow: CICOFlow,
  input: FetchProvidersOutput[]
): NormalizedQuote[] {
  const normalizedQuotes: NormalizedQuote[] = []

  input.forEach((provider) => {
    if (
      !provider.quote ||
      provider.restricted ||
      provider.unavailable ||
      (flow === CICOFlow.CashIn && !provider.cashIn) ||
      (flow === CICOFlow.CashOut && !provider.cashOut)
    )
      return
    if (isSimplexQuote(provider.quote)) {
      const paymentMethod = provider.paymentMethods[0]
      normalizedQuotes.push({
        quote: {
          paymentMethod,
          fee: provider.quote.fiat_money.total_amount - provider.quote.fiat_money.base_amount,
          kycInfo: strings.idRequired,
          timeEstimation: paymentMethod === PaymentMethod.Bank ? strings.numDays : strings.oneHour,
          onPress: () => {
            ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
              flow,
              paymentMethod,
              provider: provider.name,
            })
            navigate(Screens.Simplex, {
              simplexQuote: provider.quote as SimplexQuote,
            })
          },
        },
        provider: {
          name: provider.name,
          logo: provider.logoWide,
        },
      })
    } else {
      provider.quote.forEach((quote) => {
        normalizedQuotes.push({
          quote: {
            paymentMethod: quote.paymentMethod,
            fee: quote.fiatFee,
            kycInfo: strings.idRequired,
            timeEstimation:
              quote.paymentMethod === PaymentMethod.Bank ? strings.numDays : strings.oneHour,
            onPress: () => {
              ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
                flow,
                paymentMethod: quote.paymentMethod,
                provider: provider.name,
              })
              provider.url && navigateToURI(provider.url)
            },
          },
          provider: {
            name: provider.name,
            logo: provider.logoWide,
          },
        })
      })
    }
  })
  return normalizedQuotes
}
