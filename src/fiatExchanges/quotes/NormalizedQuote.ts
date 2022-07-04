import BigNumber from 'bignumber.js'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { Currency } from 'src/utils/currencies'

export default abstract class NormalizedQuote {
  abstract getPaymentMethod(): PaymentMethod
  abstract getFeeInFiat(exchangeRates: { [token in Currency]: string | null }): BigNumber | null
  abstract getFeeInCrypto(exchangeRates: { [token in Currency]: string | null }): BigNumber | null
  abstract getCryptoType(): Currency
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
