import BigNumber from 'bignumber.js'
import {
  DEFAULT_BANK_SETTLEMENT_ESTIMATION,
  DEFAULT_CARD_SETTLEMENT_ESTIMATION,
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
import { CiCoCurrency, Currency, resolveCICOCurrency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

export const isSimplexQuote = (quote: RawProviderQuote | SimplexQuote): quote is SimplexQuote =>
  !!quote && 'wallet_id' in quote
export default class ExternalQuote extends NormalizedQuote {
  quote: RawProviderQuote | SimplexQuote
  provider: FetchProvidersOutput
  flow: CICOFlow
  constructor({
    quote,
    provider,
    flow,
  }: {
    quote: RawProviderQuote | SimplexQuote
    provider: FetchProvidersOutput
    flow: CICOFlow
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
  }

  getPaymentMethod(): PaymentMethod {
    return isSimplexQuote(this.quote) ? this.provider.paymentMethods[0] : this.quote.paymentMethod
  }

  getCryptoType(): CiCoCurrency {
    return isSimplexQuote(this.quote)
      ? resolveCICOCurrency(this.quote.digital_money.currency)!
      : resolveCICOCurrency(this.quote.digitalAsset)!
  }

  getFeeInCrypto(
    exchangeRates: { [token in Currency]: string | null },
    tokenInfo: TokenBalance
  ): BigNumber | null {
    const fee = this.getFeeInFiat(exchangeRates, tokenInfo)
    return convertLocalToTokenAmount({
      localAmount: fee,
      exchangeRates,
      tokenInfo,
    })
  }

  getFeeInFiat(
    _exchangeRates: { [token in Currency]: string | null },
    _tokenInfo: TokenBalance
  ): BigNumber | null {
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

  getKycInfo(): string | null {
    return strings.idRequired
  }

  getTimeEstimation(): SettlementEstimation {
    // payment method can only be bank or card
    return this.getPaymentMethod() === PaymentMethod.Bank
      ? DEFAULT_BANK_SETTLEMENT_ESTIMATION
      : DEFAULT_CARD_SETTLEMENT_ESTIMATION
  }

  navigate(): void {
    if (isSimplexQuote(this.quote)) {
      navigate(Screens.Simplex, {
        simplexQuote: this.quote,
      })
    } else {
      navigateToURI(this.provider.url!)
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
}
