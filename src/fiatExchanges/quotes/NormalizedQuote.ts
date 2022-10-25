import BigNumber from 'bignumber.js'
import { Dispatch } from 'redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOFlow, PaymentMethod, ProviderSelectionAnalyticsData } from 'src/fiatExchanges/utils'
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

  abstract navigate(dispatch: Dispatch): void
  onPress(flow: CICOFlow, dispatch: Dispatch, analyticsData: ProviderSelectionAnalyticsData) {
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
        flow,
        paymentMethod: this.getPaymentMethod(),
        provider: this.getProviderId(),
        ...analyticsData,
      })
      this.navigate(dispatch)
    }
  }
}
