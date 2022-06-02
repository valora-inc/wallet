import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import {
  SUPPORTED_FIAT_ACCOUNT_SCHEMAS,
  SUPPORTED_FIAT_ACCOUNT_TYPES,
} from 'src/fiatconnect/FiatDetailsScreen'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

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

    // Check if we support the FiatAccountType and at least one of the FiatAccountSchemas
    const isFiatAccountTypeSupported = SUPPORTED_FIAT_ACCOUNT_TYPES.has(fiatAccountType)
    if (!isFiatAccountTypeSupported) {
      throw new Error(
        `Error: ${quote.provider.id}. FiatAccouuntType: ${fiatAccountType} is not supported in the app`
      )
    }
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
    this.quote = quote
    this.fiatAccountType = fiatAccountType
  }

  // TODO: Dynamically generate time estimation strings
  private getSettlementEstimation(lower: string | undefined, upper: string | undefined) {
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

  onPress(flow: CICOFlow): () => void {
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
        flow,
        paymentMethod: this.getPaymentMethod(),
        provider: this.getProviderId(),
      })
      navigate(Screens.FiatDetailsScreen, {
        quote: this,
        fiatAccountType: this.fiatAccountType,
        flow,
      })
    }
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

  getFiatAccountType(): FiatAccountType {
    return this.fiatAccountType
  }

  getFiatAccountSchema(): FiatAccountSchema {
    const fiatAccountSchemas = this.quote.fiatAccount[this.fiatAccountType]?.fiatAccountSchemas.map(
      ({ fiatAccountSchema }) => fiatAccountSchema
    )
    return fiatAccountSchemas?.find((schema) =>
      SUPPORTED_FIAT_ACCOUNT_SCHEMAS.has(schema)
    ) as FiatAccountSchema
  }
}
