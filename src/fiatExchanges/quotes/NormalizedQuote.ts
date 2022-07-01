import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'

export default abstract class NormalizedQuote {
  abstract getPaymentMethod(): PaymentMethod
  abstract getFee(): number | null
  abstract getKycInfo(): string | null
  abstract getTimeEstimation(): string | null
  abstract getProviderName(): string
  abstract getProviderLogo(): string
  abstract getProviderId(): string

  abstract navigate(flow: CICOFlow): void
  onPress(flow: CICOFlow) {
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
        flow,
        paymentMethod: this.getPaymentMethod(),
        provider: this.getProviderId(),
      })
      this.navigate(flow)
    }
  }
}
