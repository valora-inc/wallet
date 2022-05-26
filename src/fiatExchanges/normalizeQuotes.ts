import { FiatAccountSchema } from '@fiatconnect/fiatconnect-types'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatConnectQuote } from 'src/fiatconnect'
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

export interface NormalizedQuote {
  quote: QuoteInfo
  provider: ProviderInfo
}

export interface QuoteInfo {
  paymentMethod: PaymentMethod
  fee: number | null
  kycInfo: string | null
  timeEstimation: string
  onPress: () => void
}

export interface ProviderInfo {
  name: string
  logo: string
  id: string
}

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

function getSettlementEstimation(lower: string | undefined, upper: string | undefined) {
  // TODO: Dynamically generate time estimation strings
  //
  return strings.numDays
}

export function normalizeQuotes(
  flow: CICOFlow,
  fiatConnectQuotes: FiatConnectQuote[] | undefined,
  externalProviders: FetchProvidersOutput[] | undefined
): NormalizedQuote[] {
  return [
    ...normalizeFiatConnectQuotes(flow, fiatConnectQuotes),
    ...normalizeExternalProviders(flow, externalProviders),
  ].sort(sortQuotesByFee)
}

export const sortQuotesByFee = (
  { quote: quote1 }: NormalizedQuote,
  { quote: quote2 }: NormalizedQuote
) => {
  const providerFee1 = quote1.fee ?? 0
  const providerFee2 = quote2.fee ?? 0

  return providerFee1 > providerFee2 ? 1 : -1
}

export function normalizeFiatConnectQuotes(
  flow: CICOFlow,
  quotes: FiatConnectQuote[] | undefined
): NormalizedQuote[] {
  const normalizedQuotes: NormalizedQuote[] = []

  quotes?.forEach((quote) => {
    // Only supporting FiatConnect quotes with the AccountNumber fiat schema
    if (
      !quote.fiatAccount.BankAccount ||
      Object.keys(quote.fiatAccount.BankAccount.fiatAccountSchemas).includes(
        FiatAccountSchema.AccountNumber
      )
    )
      return
    normalizedQuotes.push({
      quote: {
        paymentMethod: PaymentMethod.Bank,
        fee:
          quote.fiatAccount.BankAccount.fee !== undefined
            ? parseFloat(quote.fiatAccount.BankAccount.fee)
            : null,
        kycInfo: quote.kyc.kycRequired ? strings.idRequired : null,
        timeEstimation: getSettlementEstimation(
          quote.fiatAccount.BankAccount.settlementTimeLowerBound,
          quote.fiatAccount.BankAccount.settlementTimeUpperBound
        ),
        onPress: () => {
          ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
            flow,
            paymentMethod: PaymentMethod.Bank,
            provider: quote.provider.id,
          })
          navigate(Screens.FiatDetailsScreen, {
            quote,
          })
        },
      },
      provider: {
        id: quote.provider.id,
        name: quote.provider.providerName,
        logo: quote.provider.imageUrl,
      },
    })
  })
  return normalizedQuotes
}

export function normalizeExternalProviders(
  flow: CICOFlow,
  input: FetchProvidersOutput[] | undefined
): NormalizedQuote[] {
  const normalizedQuotes: NormalizedQuote[] = []

  input?.forEach((provider) => {
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
          id: provider.name,
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
            id: provider.name,
            name: provider.name,
            logo: provider.logoWide,
          },
        })
      })
    }
  })
  return normalizedQuotes
}
