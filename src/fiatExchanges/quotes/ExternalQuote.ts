import BigNumber from 'bignumber.js'
import {
  DEFAULT_AIRTIME_SETTLEMENT_ESTIMATION,
  DEFAULT_BANK_SETTLEMENT_ESTIMATION,
  DEFAULT_CARD_SETTLEMENT_ESTIMATION,
  DEFAULT_MOBILE_MONEY_SETTLEMENT_ESTIMATION,
  SettlementEstimation,
} from 'src/fiatExchanges/quotes/constants'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { CicoQuote, PaymentMethod } from 'src/fiatExchanges/types'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TokenBalance } from 'src/tokens/slice'
import { convertLocalToTokenAmount } from 'src/tokens/utils'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

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
}

export default class ExternalQuote extends NormalizedQuote {
  quote: CicoQuote
  constructor(quote: CicoQuote) {
    super()
    this.quote = quote
  }

  getPaymentMethod() {
    return {
      Bank: PaymentMethod.Bank,
      Card: PaymentMethod.Card,
      Airtime: PaymentMethod.Airtime,
      MobileMoney: PaymentMethod.FiatConnectMobileMoney,
    }[this.quote.paymentMethod]
  }

  getCryptoType(): string {
    throw new Error('Not required for this class')
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
    return this.quote.fiatFee ? new BigNumber(this.quote.fiatFee) : null
  }

  getMobileCarrier(): string | undefined {
    return this.getPaymentMethod() === PaymentMethod.Airtime
      ? this.quote.additionalInfo?.mobileCarrier
      : undefined
  }

  getKycInfo(): string | null {
    return strings.idRequired
  }

  getTimeEstimation(): SettlementEstimation {
    return paymentMethodToSettlementTime[this.getPaymentMethod()]
  }

  navigate(): void {
    if (this.quote.additionalInfo?.simplexQuote) {
      navigate(Screens.Simplex, {
        simplexQuote: this.quote.additionalInfo.simplexQuote,
        tokenId: this.quote.tokenId,
      })
    } else if (this.quote.url) {
      navigateToURI(this.quote.url!)
    } else {
      Logger.error('ExternalQuote', 'Missing url on non simplex quote', JSON.stringify(this.quote))
    }
  }

  getProviderName(): string {
    return this.quote.provider.displayName
  }

  getProviderLogo(): string {
    return this.quote.provider.logoWideUrl
  }

  getProviderId(): string {
    return this.quote.provider.id
  }

  isProviderNew(): boolean {
    return false
  }

  getReceiveAmount(): BigNumber | null {
    // The amounts should never be undefined, but handling it just in case
    if (this.quote.txType === 'cashIn') {
      return this.quote.cryptoAmount ? new BigNumber(this.quote.cryptoAmount) : null
    } else {
      return this.quote.fiatAmount ? new BigNumber(this.quote.fiatAmount) : null
    }
  }

  getTokenId(): string {
    return this.quote.tokenId
  }
}
