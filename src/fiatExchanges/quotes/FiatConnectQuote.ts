import {
  FiatAccountSchema,
  FiatAccountType,
  FiatType,
  KycSchema,
  QuoteResponseFiatAccountSchema,
  QuoteResponseKycSchema,
} from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { Dispatch } from 'redux'
import { FiatConnectProviderInfo, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { selectFiatConnectQuote } from 'src/fiatconnect/slice'
import { DEFAULT_ALLOWED_VALUES, SettlementTime } from 'src/fiatExchanges/quotes/constants'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { TokenBalance } from 'src/tokens/slice'
import { convertLocalToTokenAmount, convertTokenToLocalAmount } from 'src/tokens/utils'
import { CiCoCurrency, resolveCICOCurrency } from 'src/utils/currencies'

const kycStrings = {
  [KycSchema.PersonalDataAndDocuments]: i18n.t('selectProviderScreen.idRequired'),
  [KycSchema.PersonalDataAndDocumentsDetailed]: i18n.t('selectProviderScreen.idRequired'),
}

// TODO: When we add support for more types be sure to add more unit tests to the FiatConnectQuotes class
const SUPPORTED_FIAT_ACCOUNT_TYPES = new Set<FiatAccountType>([
  FiatAccountType.BankAccount,
  FiatAccountType.MobileMoney,
])
const SUPPORTED_FIAT_ACCOUNT_SCHEMAS = new Set<FiatAccountSchema>([
  FiatAccountSchema.AccountNumber,
  FiatAccountSchema.IBANNumber,
  FiatAccountSchema.IFSCAccount,
  FiatAccountSchema.MobileMoney,
])
const SUPPORTED_KYC_SCHEMAS = new Set<KycSchema>([KycSchema.PersonalDataAndDocuments])

export default class FiatConnectQuote extends NormalizedQuote {
  quote: FiatConnectQuoteSuccess
  fiatAccountType: FiatAccountType
  flow: CICOFlow
  quoteResponseFiatAccountSchema: QuoteResponseFiatAccountSchema
  quoteResponseKycSchema?: QuoteResponseKycSchema

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

    // Check if at least one of the KYC schemas is supported; if multiple are allowed for the quote,
    // choose the first supported one for now.
    if (quote.kyc.kycRequired) {
      this.quoteResponseKycSchema = quote.kyc.kycSchemas.find((kycSchemaInfo) =>
        SUPPORTED_KYC_SCHEMAS.has(kycSchemaInfo.kycSchema)
      )
      if (!this.quoteResponseKycSchema) {
        throw new Error(
          `Error: ${quote.provider.id}. Quote requires KYC, but only unsupported schemas.`
        )
      }
    }

    this.quote = quote
    this.fiatAccountType = fiatAccountType
    this.flow = flow
    // NOTE: since we only support 1 fiat account schema right now, this is hardcoded to use a single fiat account.
    // (Providers might support multiple fiat account schemas for the same quote.)
    this.quoteResponseFiatAccountSchema = quoteResponseFiatAccountSchema
  }

  getPaymentMethod(): PaymentMethod {
    const fiatAccountToPaymentMethodMap = {
      [FiatAccountType.BankAccount]: PaymentMethod.Bank,
      [FiatAccountType.MobileMoney]: PaymentMethod.FiatConnectMobileMoney,
      [FiatAccountType.DuniaWallet]: PaymentMethod.FiatConnectMobileMoney,
    }
    return fiatAccountToPaymentMethodMap[this.fiatAccountType]
  }

  _getFee(): BigNumber | null {
    const feeString = this.quote.quote.fee
    return feeString !== undefined ? new BigNumber(feeString) : null
  }
  // FiatConnect quotes denominate fees in fiat & crypto for CashIn & CashOut respectively
  getFeeInCrypto(
    exchangeRates: { cGLD: string | null; cUSD: string | null; cEUR: string | null },
    tokenInfo: TokenBalance
  ): BigNumber | null {
    const fee = this._getFee()
    if (this.flow === CICOFlow.CashOut) {
      return fee
    }
    return convertLocalToTokenAmount({
      localAmount: fee,
      tokenInfo,
      exchangeRates,
    })
  }

  // FiatConnect quotes denominate fees in fiat & crypto for CashIn & CashOut respectively
  getFeeInFiat(
    exchangeRates: { cGLD: string | null; cUSD: string | null; cEUR: string | null },
    tokenInfo: TokenBalance
  ): BigNumber | null {
    const fee = this._getFee()
    if (this.flow === CICOFlow.CashIn) {
      return fee
    }
    return convertTokenToLocalAmount({
      tokenAmount: fee,
      tokenInfo,
      exchangeRates,
    })
  }

  getKycInfo(): string | null {
    return this.quoteResponseKycSchema ? kycStrings[this.quoteResponseKycSchema.kycSchema] : null
  }

  getKycSchema(): KycSchema | undefined {
    return this.quoteResponseKycSchema?.kycSchema
  }

  // TODO: Dynamically generate time estimation strings
  getTimeEstimation(): SettlementTime {
    // payment method can only be bank or fc mobile money
    return this.getPaymentMethod() === PaymentMethod.Bank
      ? SettlementTime.ONE_TO_THREE_DAYS
      : SettlementTime.LESS_THAN_24_HOURS
  }

  navigate(dispatch: Dispatch): void {
    dispatch(selectFiatConnectQuote({ quote: this }))
  }

  getProviderInfo(): FiatConnectProviderInfo {
    return this.quote.provider
  }

  getProviderApiKey(): string | undefined {
    return this.quote.provider.apiKey
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

  isProviderNew(): boolean {
    return this.flow === CICOFlow.CashIn
      ? this.quote.provider.isNew.in
      : this.quote.provider.isNew.out
  }

  getProviderBaseUrl(): string {
    return this.quote.provider.baseUrl
  }

  getProviderWebsiteUrl(): string {
    return this.quote.provider.websiteUrl
  }

  getProviderTermsAndConditionsUrl(): string {
    return this.quote.provider.termsAndConditionsUrl
  }

  getProviderPrivacyPolicyUrl(): string {
    return this.quote.provider.privacyPolicyUrl
  }

  getProviderIcon(): string {
    return this.quote.provider.iconUrl
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

  getCryptoTypeString(): string {
    // todo eventually rename this to getCryptoType and rename getCryptoType to getCryptoCurrency
    return this.quote.quote.cryptoType
  }

  getCryptoType(): CiCoCurrency {
    return resolveCICOCurrency(this.quote.quote.cryptoType)
  }

  getFiatAccountType(): FiatAccountType {
    return this.fiatAccountType
  }

  getFiatAccountSchema(): FiatAccountSchema {
    return this.quoteResponseFiatAccountSchema.fiatAccountSchema
  }

  getFiatAccountSchemaAllowedValues(key: string): string[] | undefined {
    const schemaDefaultValues = DEFAULT_ALLOWED_VALUES[this.getFiatAccountSchema()]
    const defaultValue = schemaDefaultValues?.[key as keyof typeof schemaDefaultValues]
    return this.quoteResponseFiatAccountSchema.allowedValues[key] ?? defaultValue
  }

  getQuoteId(): string {
    return this.quote.quote.quoteId
  }

  getGuaranteedUntil(): Date {
    return new Date(this.quote.quote.guaranteedUntil)
  }
}
