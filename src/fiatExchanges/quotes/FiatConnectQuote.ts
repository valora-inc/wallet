import {
  FiatAccountSchema,
  FiatAccountType,
  FiatType,
  QuoteResponseFiatAccountSchema,
} from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import {
  SUPPORTED_FIAT_ACCOUNT_SCHEMAS,
  SUPPORTED_FIAT_ACCOUNT_TYPES,
} from 'src/fiatconnect/FiatDetailsScreen'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import {
  convertCurrencyToLocalAmount,
  convertLocalAmountToCurrency,
} from 'src/localCurrency/convert'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency, resolveCurrency } from 'src/utils/currencies'

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

export default class FiatConnectQuote extends NormalizedQuote {
  quote: FiatConnectQuoteSuccess
  fiatAccountType: FiatAccountType
  flow: CICOFlow
  quoteResponseFiatAccountSchema: QuoteResponseFiatAccountSchema
  constructor({
    quote,
    fiatAccountType,
    flow,
  }: {
    quote: FiatConnectQuoteSuccess
    fiatAccountType: keyof typeof quote.fiatAccount
    // TODO: Get flow from the quote object once it is added to the spec https://github.com/fiatconnect/specification/pull/67
    flow: CICOFlow
  }) {
    super()

    // Check if we support the FiatAccountType
    const isFiatAccountTypeSupported = SUPPORTED_FIAT_ACCOUNT_TYPES.has(fiatAccountType)
    if (!isFiatAccountTypeSupported) {
      throw new Error(
        `Error: ${quote.provider.id}. FiatAccountType: ${fiatAccountType} is not supported in the app`
      )
    }
    // Find a supported FiatAccountSchema
    const quoteResponseFiatAccountSchema = quote.fiatAccount[
      fiatAccountType
    ]?.fiatAccountSchemas.find((schema) =>
      SUPPORTED_FIAT_ACCOUNT_SCHEMAS.has(schema.fiatAccountSchema)
    )
    if (!quoteResponseFiatAccountSchema) {
      throw new Error(
        `Error: ${quote.provider.id}. None of the following FiatAccountSchema's are supported: ${quote.fiatAccount[fiatAccountType]?.fiatAccountSchemas}`
      )
    }

    // Check if at least one of the KYC schemas is supported
    const isKycSchemaSupported = !quote.kyc.kycRequired // Currently we don't support kyc
    if (!isKycSchemaSupported) {
      throw new Error(`Error: ${quote.provider.id}. We don't support KYC for fiatconnect yet`)
    }
    this.quote = quote
    this.fiatAccountType = fiatAccountType
    this.flow = flow
    // NOTE: since we only support 1 fiat account schema right now, this is hardcoded to use a single fiat account.
    // (Providers might support multiple fiat account schemas for the same quote.)
    this.quoteResponseFiatAccountSchema = quoteResponseFiatAccountSchema
  }

  // TODO: Dynamically generate time estimation strings
  private getSettlementEstimation(lower?: string, upper?: string) {
    return strings.numDays
  }

  getPaymentMethod(): PaymentMethod {
    const fiatAccountToPaymentMethodMap = {
      [FiatAccountType.BankAccount]: PaymentMethod.Bank,
      [FiatAccountType.MobileMoney]: PaymentMethod.MobileMoney,
      [FiatAccountType.DuniaWallet]: PaymentMethod.MobileMoney,
    }
    return fiatAccountToPaymentMethodMap[this.fiatAccountType]
  }

  _getFee(): BigNumber | null {
    const feeString = this.quote.fiatAccount[this.fiatAccountType]?.fee
    return feeString !== undefined ? new BigNumber(feeString) : null
  }
  // FiatConnect quotes denominate fees in fiat & crypto for CashIn & CashOut respectively
  getFeeInCrypto(exchangeRates: { [token in Currency]: string | null }): BigNumber | null {
    if (this.flow === CICOFlow.CashOut) {
      return this._getFee()
    }
    return convertLocalAmountToCurrency(this._getFee(), exchangeRates[this.getCryptoType()])
  }

  // FiatConnect quotes denominate fees in fiat & crypto for CashIn & CashOut respectively
  getFeeInFiat(exchangeRates: { [token in Currency]: string | null }): BigNumber | null {
    if (this.flow === CICOFlow.CashIn) {
      return this._getFee()
    }
    return convertCurrencyToLocalAmount(this._getFee(), exchangeRates[this.getCryptoType()])
  }

  // TODO: make kyc info dynamic based on kyc schema
  getKycInfo(): string | null {
    return this.quote.kyc.kycRequired ? strings.idRequired : null
  }

  getTimeEstimation(): string | null {
    return this.getSettlementEstimation(
      this.quote.fiatAccount[this.fiatAccountType]?.settlementTimeLowerBound,
      this.quote.fiatAccount[this.fiatAccountType]?.settlementTimeUpperBound
    )
  }

  navigate(flow: CICOFlow): void {
    navigate(Screens.FiatDetailsScreen, {
      quote: this,
      flow,
    })
  }

  getProviderName(): string {
    return this.quote.provider.providerName
  }

  getProviderLogo(): string {
    return this.quote.provider.imageUrl
  }

  getProviderId(): string {
    return this.quote.provider.id
  }

  getProviderBaseUrl(): string {
    return this.quote.provider.baseUrl
  }

  getFiatAmount(): string {
    return this.quote.quote.fiatAmount
  }

  getFiatType(): FiatType {
    return this.quote.quote.fiatType
  }

  getCryptoAmount(): string {
    return this.quote.quote.cryptoAmount
  }

  getCryptoType(): Currency {
    return resolveCurrency(this.quote.quote.cryptoType)!
  }

  getFiatAccountType(): FiatAccountType {
    return this.fiatAccountType
  }

  getFiatAccountSchema(): FiatAccountSchema {
    return this.quoteResponseFiatAccountSchema.fiatAccountSchema
  }

  getFiatAccountSchemaAllowedValues(): { [key: string]: string[] } {
    return this.quoteResponseFiatAccountSchema.allowedValues
  }
}
