import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'

export default abstract class NormalizedQuote {
  abstract getPaymentMethod(): PaymentMethod
  abstract getFee(): number | null
  abstract getKycInfo(): string | null
  abstract getTimeEstimation(): string | null
  abstract getOnPressFunction(): (flow: CICOFlow) => void
  abstract getProviderName(): string
  abstract getProviderLogo(): string
  abstract getProviderId(): string
}
