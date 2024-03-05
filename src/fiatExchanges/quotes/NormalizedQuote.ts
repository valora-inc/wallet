import BigNumber from 'bignumber.js'
import { Dispatch } from '@reduxjs/toolkit'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SettlementEstimation } from 'src/fiatExchanges/quotes/constants'
import { ProviderSelectionAnalyticsData } from 'src/fiatExchanges/types'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { TokenBalance } from 'src/tokens/slice'

export default abstract class NormalizedQuote {
  abstract getPaymentMethod(): PaymentMethod
  abstract getFeeInFiat(usdToLocalRate: string | null, tokenInfo: TokenBalance): BigNumber | null
  abstract getFeeInCrypto(usdToLocalRate: string | null, tokenInfo: TokenBalance): BigNumber | null
  abstract getCryptoType(): string
  abstract getMobileCarrier(): string | undefined
  abstract getKycInfo(): string | null
  abstract getTimeEstimation(): SettlementEstimation
  abstract getProviderName(): string
  abstract getProviderLogo(): string
  abstract getProviderId(): string
  abstract isProviderNew(): boolean
  abstract getReceiveAmount(): BigNumber | null
  abstract getTokenId(): string

  abstract navigate(dispatch: Dispatch): void
  onPress(
    flow: CICOFlow,
    dispatch: Dispatch,
    analyticsData: ProviderSelectionAnalyticsData,
    feeCryptoAmount?: BigNumber | null
  ) {
    const feeCryptoAmountNumber = feeCryptoAmount?.toNumber()
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
        flow,
        paymentMethod: this.getPaymentMethod(),
        provider: this.getProviderId(),
        feeCryptoAmount: feeCryptoAmountNumber,
        kycRequired: !!this.getKycInfo(),
        isLowestFee: feeCryptoAmount
          ? feeCryptoAmountNumber === analyticsData.lowestFeeCryptoAmount
          : undefined,
        ...analyticsData,
      })
      this.navigate(dispatch)
    }
  }
}
