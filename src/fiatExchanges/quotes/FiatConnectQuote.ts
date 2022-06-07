import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import {
  SUPPORTED_FIAT_ACCOUNT_SCHEMAS,
  SUPPORTED_FIAT_ACCOUNT_TYPES,
} from 'src/fiatconnect/FiatDetailsScreen'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { PaymentMethod } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

export default class FiatConnectQuote extends NormalizedQuote {
  quote: FiatConnectQuoteSuccess
  fiatAccountType: FiatAccountType
  constructor({
    quote,
    fiatAccountType,
  }: {
    quote: FiatConnectQuoteSuccess
    fiatAccountType: keyof typeof quote.fiatAccount
  }) {
    super()

    // Check if we support the FiatAccountType
    const isFiatAccountTypeSupported = SUPPORTED_FIAT_ACCOUNT_TYPES.has(fiatAccountType)
    if (!isFiatAccountTypeSupported) {
      throw new Error(
        `Error: ${quote.provider.id}. FiatAccountType: ${fiatAccountType} is not supported in the app`
      )
    }
    // Check if at least one of the FiatAccountSchemas is supported
    const isFiatAccountSchemaSupported = quote.fiatAccount[
      fiatAccountType
    ]?.fiatAccountSchemas.some((schema) =>
      SUPPORTED_FIAT_ACCOUNT_SCHEMAS.has(schema.fiatAccountSchema)
    )
    if (!isFiatAccountSchemaSupported) {
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
  }

  // TODO: Dynamically generate time estimation strings
  private getSettlementEstimation(lower?: string, upper?: string) {
    return strings.numDays
  }

  getPaymentMethod(): PaymentMethod {
    const fiatAccountToPaymentMethodMap = {
      [FiatAccountType.BankAccount]: PaymentMethod.Bank,
    }
    return fiatAccountToPaymentMethodMap[this.fiatAccountType]
  }

  getFee(): number | null {
    const feeString = this.quote.fiatAccount[this.fiatAccountType]?.fee
    return feeString !== undefined ? parseFloat(feeString) : null
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

  // TODO: Integrate the FiatConnectQuote class into the FiatDetailsScreen
  navigate(): void {
    // navigate(Screens.FiatDetailsScreen, {
    //   quote: this,
    //   fiatAccountType: this.fiatAccountType,
    //   flow,
    // })
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
}
