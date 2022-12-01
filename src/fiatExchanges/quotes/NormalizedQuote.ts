import BigNumber from 'bignumber.js'
import { Dispatch } from 'redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SettlementTime, SettlementTime2 } from 'src/fiatExchanges/quotes/constants'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { Currency } from 'src/utils/currencies'

export default abstract class NormalizedQuote {
  abstract getPaymentMethod(): PaymentMethod
  abstract getFeeInFiat(exchangeRates: { [token in Currency]: string | null }): BigNumber | null
  abstract getFeeInCrypto(exchangeRates: { [token in Currency]: string | null }): BigNumber | null
  abstract getCryptoType(): Currency
  abstract getKycInfo(): string | null
  abstract getTimeEstimation(): SettlementTime
  abstract getTimeEstimation2(): SettlementTime2
  abstract getProviderName(): string
  abstract getProviderLogo(): string
  abstract getProviderId(): string
  abstract isProviderNew(): boolean

  abstract navigate(dispatch: Dispatch): void
  onPress(flow: CICOFlow, dispatch: Dispatch) {
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
        flow,
        paymentMethod: this.getPaymentMethod(),
        provider: this.getProviderId(),
      })
      this.navigate(dispatch)
    }
  }
}
