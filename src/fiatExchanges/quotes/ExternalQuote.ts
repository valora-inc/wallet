import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import {
  CICOFlow,
  FetchProvidersOutput,
  PaymentMethod,
  RawProviderQuote,
  SimplexQuote,
} from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

export const isSimplexQuote = (quote: RawProviderQuote | SimplexQuote): quote is SimplexQuote =>
  !!quote && 'wallet_id' in quote
export default class ExternalQuote extends NormalizedQuote {
  quote: RawProviderQuote | SimplexQuote
  provider: FetchProvidersOutput
  constructor({
    quote,
    provider,
    flow,
  }: {
    quote: RawProviderQuote | SimplexQuote
    provider: FetchProvidersOutput
    flow: CICOFlow
  }) {
    super()
    if (provider.restricted) {
      throw new Error(`Error: ${provider.name}. Quote is restricted`)
    }
    if (provider.unavailable) {
      throw new Error(`Error: ${provider.name}. Quote is unavailable`)
    }
    if (
      (flow === CICOFlow.CashIn && !provider.cashIn) ||
      (flow === CICOFlow.CashOut && !provider.cashOut)
    ) {
      throw new Error(
        `Error: ${provider.name}. Quote not processed because it does not support the ${flow} CICO flow`
      )
    }
    this.quote = quote
    this.provider = provider
  }

  getPaymentMethod(): PaymentMethod {
    return isSimplexQuote(this.quote) ? this.provider.paymentMethods[0] : this.quote.paymentMethod
  }

  getFee(): number | null {
    return isSimplexQuote(this.quote)
      ? this.quote.fiat_money.total_amount - this.quote.fiat_money.base_amount
      : this.quote.fiatFee
  }

  getKycInfo(): string | null {
    return strings.idRequired
  }

  getTimeEstimation(): string | null {
    return this.getPaymentMethod() === PaymentMethod.Bank ? strings.numDays : strings.oneHour
  }

  onPress(flow: CICOFlow): () => void {
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
        flow,
        paymentMethod: this.getPaymentMethod(),
        provider: this.getProviderName(),
      })
      if (isSimplexQuote(this.quote)) {
        navigate(Screens.Simplex, {
          simplexQuote: this.quote,
        })
      } else {
        this.provider.url && navigateToURI(this.provider.url)
      }
    }
  }

  getProviderName(): string {
    return this.provider.name
  }

  getProviderLogo(): string {
    return this.provider.logoWide
  }

  getProviderId(): string {
    return this.provider.name
  }
}
