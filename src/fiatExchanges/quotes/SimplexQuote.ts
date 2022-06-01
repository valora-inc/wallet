import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import {
  CICOFlow,
  FetchProvidersOutput,
  PaymentMethod,
  RawSimplexQuote,
} from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

export default class SimplexQuote extends NormalizedQuote {
  quote: RawSimplexQuote
  provider: FetchProvidersOutput
  constructor({ quote, provider }: { quote: RawSimplexQuote; provider: FetchProvidersOutput }) {
    super()
    this.quote = quote
    this.provider = provider
  }

  getPaymentMethod(): PaymentMethod {
    return this.provider.paymentMethods[0]
  }

  getFee(): number | null {
    return this.quote.fiat_money.total_amount - this.quote.fiat_money.base_amount
  }

  getKycInfo(): string | null {
    return strings.idRequired
  }

  getTimeEstimation(): string | null {
    return this.getPaymentMethod() === PaymentMethod.Bank ? strings.numDays : strings.oneHour
  }

  getOnPressFunction(): (flow: CICOFlow) => void {
    return (flow: CICOFlow) => {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
        flow,
        paymentMethod: this.getPaymentMethod(),
        provider: this.getProviderName(),
      })
      navigate(Screens.Simplex, {
        simplexQuote: this.quote,
      })
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
