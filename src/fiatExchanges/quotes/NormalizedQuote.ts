import BigNumber from 'bignumber.js'
import { Dispatch } from 'redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SettlementTime } from 'src/fiatExchanges/quotes/constants'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { TokenBalance } from 'src/tokens/slice'
import { CiCoCurrency, Currency } from 'src/utils/currencies'

export default abstract class NormalizedQuote {
  abstract getPaymentMethod(): PaymentMethod
  abstract getFeeInFiat(
    exchangeRates: { [token in Currency]: string | null },
    tokenInfo: TokenBalance | undefined
  ): BigNumber | null
  abstract getFeeInCrypto(
    exchangeRates: { [token in Currency]: string | null },
    tokenInfo: TokenBalance | undefined
  ): BigNumber | null
  abstract getCryptoType(): CiCoCurrency
  abstract getKycInfo(): string | null
  abstract getTimeEstimation(): SettlementTime
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
