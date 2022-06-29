import {
  CryptoType,
  FiatAccountSchema,
  FiatAccountType,
  FiatType,
} from '@fiatconnect/fiatconnect-types'
import { FiatConnectApiClient } from '@fiatconnect/fiatconnect-sdk'
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
import { FiatConnectApiClient, FiatConnectClient } from '@fiatconnect/fiatconnect-sdk'
import { UnlockableWallet } from '@celo/wallet-base'
import { getSigningFunction } from 'src/fiatconnect/index'
import { getContractKitAsync } from 'src/web3/contracts'
import { FIATCONNECT_NETWORK } from 'src/config'

const strings = {
  oneHour: i18n.t('selectProviderScreen.oneHour'),
  numDays: i18n.t('selectProviderScreen.numDays'),
  idRequired: i18n.t('selectProviderScreen.idRequired'),
}

export default class FiatConnectQuote extends NormalizedQuote {
  quote: FiatConnectQuoteSuccess
  fiatAccountType: FiatAccountType
  fiatConnectClient?: FiatConnectApiClient

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
      [FiatAccountType.MobileMoney]: PaymentMethod.MobileMoney,
      [FiatAccountType.DuniaWallet]: PaymentMethod.MobileMoney,
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

  getCryptoType(): CryptoType {
    return this.quote.quote.cryptoType
  }

  getFiatAccountType(): FiatAccountType {
    return this.fiatAccountType
  }

  getFiatAccountSchema(): FiatAccountSchema {
    // NOTE: since we only support 1 fiat account schema right now, this is hardcoded to use a single fiat account.
    // (Providers might support multiple fiat account schemas for the same quote.)
    const fiatAccountSchemas = this.quote.fiatAccount[this.fiatAccountType]?.fiatAccountSchemas.map(
      ({ fiatAccountSchema }) => fiatAccountSchema
    )
    return fiatAccountSchemas?.find((schema) =>
      SUPPORTED_FIAT_ACCOUNT_SCHEMAS.has(schema)
    ) as FiatAccountSchema
  }

  async getFiatConnectClient(): Promise<FiatConnectApiClient> {
    if (this.fiatConnectClient) {
      return this.fiatConnectClient
    }
    const kit = await getContractKitAsync()
    const wallet = kit.getWallet()! as UnlockableWallet
    const [account] = wallet.getAccounts()
    this.fiatConnectClient = new FiatConnectClient(
      {
        baseUrl: this.quote.provider.baseUrl,
        network: FIATCONNECT_NETWORK,
        accountAddress: account,
      },
      getSigningFunction(wallet)
    )
    return this.fiatConnectClient
  }
}
