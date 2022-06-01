import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import {
  CICOFlow,
  FetchProvidersOutput,
  PaymentMethod,
  RawProviderQuote,
} from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { navigateToURI } from 'src/utils/linking'

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

export class ExternalQuote extends NormalizedQuote {
  quote: RawProviderQuote
  provider: FetchProvidersOutput
  constructor({ quote, provider }: { quote: RawProviderQuote; provider: FetchProvidersOutput }) {
    super()
    this.quote = quote
    this.provider = provider
  }

  getPaymentMethod(): PaymentMethod {
    return this.quote.paymentMethod
  }

  getFee(): number | null {
    return this.quote.fiatFee
  }

  getKycInfo(): string | null {
    return strings.idRequired
  }

  getTimeEstimation(): string | null {
    return this.quote.paymentMethod === PaymentMethod.Bank ? strings.numDays : strings.oneHour
  }

  getOnPressFunction(): (flow: CICOFlow) => void {
    return (flow: CICOFlow) => {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
        flow,
        paymentMethod: this.getPaymentMethod(),
        provider: this.getProviderName(),
      })
      this.provider.url && navigateToURI(this.provider.url)
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
