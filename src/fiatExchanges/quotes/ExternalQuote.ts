import BigNumber from 'bignumber.js'
import {
  DEFAULT_AIRTIME_SETTLEMENT_ESTIMATION,
  DEFAULT_BANK_SETTLEMENT_ESTIMATION,
  DEFAULT_CARD_SETTLEMENT_ESTIMATION,
  DEFAULT_MOBILE_MONEY_SETTLEMENT_ESTIMATION,
  SettlementEstimation,
} from 'src/fiatExchanges/quotes/constants'
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
import { TokenBalance } from 'src/tokens/slice'
import { convertLocalToTokenAmount } from 'src/tokens/utils'
import { navigateToURI } from 'src/utils/linking'

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

const paymentMethodToSettlementTime = {
  [PaymentMethod.Bank]: DEFAULT_BANK_SETTLEMENT_ESTIMATION,
  [PaymentMethod.Card]: DEFAULT_CARD_SETTLEMENT_ESTIMATION,
  [PaymentMethod.Airtime]: DEFAULT_AIRTIME_SETTLEMENT_ESTIMATION,
  [PaymentMethod.MobileMoney]: DEFAULT_MOBILE_MONEY_SETTLEMENT_ESTIMATION,
  [PaymentMethod.FiatConnectMobileMoney]: DEFAULT_MOBILE_MONEY_SETTLEMENT_ESTIMATION,
  [PaymentMethod.Coinbase]: DEFAULT_CARD_SETTLEMENT_ESTIMATION,
}

export const isSimplexQuote = (quote: RawProviderQuote | SimplexQuote): quote is SimplexQuote =>
  !!quote && 'wallet_id' in quote
export default class ExternalQuote extends NormalizedQuote {
  quote: RawProviderQuote | SimplexQuote
  provider: FetchProvidersOutput
  flow: CICOFlow
  tokenId: string
  constructor({
    quote,
    provider,
    flow,
    tokenId,
  }: {
    quote: RawProviderQuote | SimplexQuote
    provider: FetchProvidersOutput
    flow: CICOFlow
    tokenId: string
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
    this.flow = flow
    this.tokenId = tokenId
  }

  getPaymentMethod(): PaymentMethod {
    return isSimplexQuote(this.quote) ? this.provider.paymentMethods[0] : this.quote.paymentMethod
  }

  getCryptoType(): string {
    return isSimplexQuote(this.quote) ? this.quote.digital_money.currency : this.quote.digitalAsset
  }

  getFeeInCrypto(usdToLocalRate: string | null, tokenInfo: TokenBalance): BigNumber | null {
    const fee = this.getFeeInFiat(usdToLocalRate, tokenInfo)
    return convertLocalToTokenAmount({
      localAmount: fee,
      usdToLocalRate,
      tokenInfo,
    })
  }

  getFeeInFiat(_usdToLocalRate: string | null, _tokenInfo: TokenBalance): BigNumber | null {
    if (isSimplexQuote(this.quote)) {
      return new BigNumber(this.quote.fiat_money.total_amount).minus(
        new BigNumber(this.quote.fiat_money.base_amount)
      )
    } else if (typeof this.quote.fiatFee === 'number') {
      // Can't just check for truthiness since `0` fails this and introduces a regression
      return BigNumber(this.quote.fiatFee)
    }
    return null
  }

  getMobileCarrier(): string | undefined {
    return !isSimplexQuote(this.quote) &&
      this.getPaymentMethod() === PaymentMethod.Airtime &&
      this.quote.extraReqs?.mobileCarrier
      ? this.quote.extraReqs.mobileCarrier
      : undefined
  }

  getKycInfo(): string | null {
    return strings.idRequired
  }

  getTimeEstimation(): SettlementEstimation {
    return paymentMethodToSettlementTime[this.getPaymentMethod()]
  }

  navigate(): void {
    if (isSimplexQuote(this.quote)) {
      navigate(Screens.Simplex, {
        simplexQuote: this.quote,
        tokenId: this.tokenId,
      })
    } else {
      const url = this.quote.url ?? this.provider.url
      navigateToURI(url!)
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

  isProviderNew(): boolean {
    return false
  }

  getReceiveAmount(): BigNumber | null {
    if (isSimplexQuote(this.quote)) {
      if (this.flow === CICOFlow.CashIn) {
        return new BigNumber(this.quote.digital_money.amount)
      } else {
        // simplex is cash in only, this should never be reached
        return null
      }
    }

    return typeof this.quote.returnedAmount !== 'undefined'
      ? new BigNumber(this.quote.returnedAmount)
      : null
  }

  getTokenId(): string {
    return this.tokenId
  }
}
