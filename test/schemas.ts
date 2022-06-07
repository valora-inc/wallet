import _ from 'lodash'
import { FinclusiveKycStatus, PincodeType } from 'src/account/reducer'
import { AppState } from 'src/app/actions'
import { SuperchargeButtonType } from 'src/app/types'
import { CodeInputStatus } from 'src/components/CodeInput'
import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { PaymentDeepLinkHandler } from 'src/merchantPayment/types'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'
import { idle, KomenciAvailable } from 'src/verify/reducer'
import {
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockTestTokenAddress,
} from 'test/values'

// Default (version -1 schema)
export const vNeg1Schema = {
  app: {
    inviteCodeEntered: false,
    loggedIn: false,
    numberVerified: false,
    error: null,
    dismissErrorAfter: null,
    language: 'es-419',
    doingBackupFlow: false,
    message: null,
    dismissMessageAfter: null,
    analyticsEnabled: true,
    lockWithPinEnabled: false,
    appState: AppState.Active,
    locked: false,
    lastTimeBackgrounded: 0,
  },
  networkInfo: {
    connected: true,
    rehydrated: true,
  },
  send: {
    isSending: false,
    recentRecipients: [],
    recentPayments: [],
  },
  recipients: {
    recipientCache: {},
  },
  goldToken: {
    balance: null,
    educationCompleted: false,
    lastFetch: null,
  },
  stableToken: {
    balance: null,
    educationCompleted: false,
    lastFetch: null,
  },
  home: {
    loading: false,
    notifications: [],
  },
  medianator: {
    exchangeRate: '1',
  },
  transactions: {
    standbyTransactions: [],
    standbyTransactionsLegacy: [],
  },
  web3: {
    syncProgress: {
      startingBlock: 0,
      currentBlock: 100,
      highestBlock: 100,
    },
    latestBlockNumber: 0,
    account: '0x0000000000000000000000000000000000007E57',
    accountInWeb3Keystore: '0x0000000000000000000000000000000000007E57',
    commentKey: '0x0000000000000000000000000000000000008F68',
    gasPriceLastUpdated: 0,
    fornoMode: false,
    contractKitReady: true,
  },
  geth: {
    initialized: 'INITIALIZED',
    connected: true,
    gethStartedThisSession: false,
  },
  identity: {
    attestationCodes: [],
    numCompleteAttestations: 0,
    verificationFailed: false,
    addressToE164Number: {},
    e164NumberToAddress: {},
    e164NumberToSalt: {},
    startedVerification: false,
    askedContactsPermission: false,
    isLoadingImportContacts: false,
    acceptedAttestationCodes: [],
    verificationStatus: 0,
    hasSeenVerificationNux: false,
    contactMappingProgress: {
      current: 0,
      total: 0,
    },
  },
  account: {
    name: 'John Doe',
    e164PhoneNumber: '+14155556666',
    defaultCountryCode: '+1',
    contactDetails: {
      contactId: 'contactId',
      thumbnailPath: null,
    },
    devModeActive: false,
    devModeClickCount: 0,
    photosNUXClicked: false,
    pincodeSet: false,
    pincodeType: PincodeType.Unset,
    isSettingPin: false,
    accountCreationTime: 99999999999999,
    backupCompleted: false,
    backupDelayedTime: 0,
    socialBackupCompleted: false,
    incomingPaymentRequests: [],
    outgoingPaymentRequests: [],
    dismissedGetVerified: false,
    dismissedInviteFriends: false,
    promptFornoIfNeeded: false,
    acceptedTerms: false,
  },
  invite: {
    isSendingInvite: false,
    isRedeemingInvite: false,
    isSkippingInvite: false,
    invitees: {},
    redeemedTempAccountPrivateKey: '',
    redeemComplete: false,
  },
  escrow: {
    isReclaiming: false,
    sentEscrowedPayments: [],
    suggestedFee: null,
  },
  localCurrency: {
    isLoading: false,
    exchangeRate: '1.33',
    preferredCurrencyCode: 'PHP',
    fetchedCurrencyCode: 'PHP',
  },
  imports: {
    isImportingWallet: false,
  },
  exchange: {
    exchangeRatePair: null,
    history: {
      isLoading: false,
      celoGoldExchangeRates: [],
      lastTimeUpdated: 0,
    },
    tobinTax: '0',
  },
}

export const v0Schema = {
  ...vNeg1Schema,
  account: {
    ...vNeg1Schema.account,
    dismissedEarnRewards: false,
  },
  invite: {
    ...vNeg1Schema.invite,
    invitees: [],
  },
}

export const v1Schema = {
  ...v0Schema,
  exchange: {
    ...v0Schema.exchange,
    history: {
      ...v0Schema.exchange.history,
      aggregatedExchangeRates: [],
      granularity: 60,
      range: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  },
  identity: {
    ...v0Schema.identity,
    importContactsProgress: {
      status: 0,
      current: 0,
      total: 0,
    },
    matchedContacts: {},
    secureSendPhoneNumberMapping: {},
  },
  transactions: {
    ...v0Schema.transactions,
    knownFeedTransactions: {},
    recentTxRecipientsCache: {},
  },
  account: {
    ...v0Schema.account,
    retryVerificationWithForno: true,
  },
  app: {
    ...v0Schema.app,
    requirePinOnAppOpen: false,
  },
}

export const v2Schema = {
  ...v1Schema,
  app: {
    ...v1Schema.app,
    sessionId: '',
  },
}

export const v3Schema = {
  ...v2Schema,
  account: {
    ...v2Schema.account,
    hasMigratedToNewBip39: false,
    choseToRestoreAccount: false,
  },
  identity: {
    ...v2Schema.identity,
    addressToDataEncryptionKey: {},
  },
  web3: {
    ...v2Schema.web3,
    isDekRegistered: false,
  },
  geth: {
    ...v2Schema.geth,
    chainHead: {
      number: 100,
      timestamp: 1596502618,
      hash: '0x0000000000000000000000000000000000000000000000000000000000000F00',
    },
  },
}

// Skipping v4 to match the Redux store version
// It's not critical but it's good to keep those in sync
export const v5Schema = {
  ...v3Schema,
  account: {
    ...v3Schema.account,
    incomingPaymentRequests: undefined,
    outgoingPaymentRequests: undefined,
    dismissedGoldEducation: false,
  },
  paymentRequest: {
    incomingPaymentRequests: [],
    outgoingPaymentRequests: [],
  },
  web3: {
    ...v3Schema.web3,
    dataEncryptionKey: '0x0000000000000000000000000000000000008F68',
    commentKey: undefined,
  },
  identity: {
    ...v3Schema.identity,
    lastRevealAttempt: null,
    verificationState: {
      isLoading: false,
      phoneHashDetails: {
        e164Number: '',
        phoneHash: '',
        pepper: '',
      },
      actionableAttestations: [],
      status: {
        isVerified: false,
        numAttestationsRemaining: NUM_ATTESTATIONS_REQUIRED,
        total: 0,
        completed: 0,
      },
      lastFetch: null,
    },
    addressToDisplayName: {},
  },
  exchange: {
    ...v3Schema.exchange,
    isLoading: false,
  },
  app: {
    ...v3Schema.app,
    minVersion: null,
    inviteModalVisible: false,
  },
}

export const v6Schema = {
  ...v5Schema,
  web3: {
    ...v5Schema.web3,
    mtwAddress: null,
  },
  identity: {
    ...v5Schema.identity,
    walletToAccountAddress: {},
  },
  app: {
    ...v5Schema.app,
    pontoEnabled: false,
    kotaniEnabled: false,
  },
}

export const v7Schema = {
  ...v6Schema,
  identity: {
    ...v6Schema.identity,
    feelessAttestationCodes: [],
    feelessProcessingInputCode: false,
    feelessAcceptedAttestationCodes: [],
    feelessNumCompleteAttestations: 0,
    feelessVerificationStatus: 0,
    feelessVerificationState: {
      isLoading: false,
      isActive: false,
      phoneHashDetails: {
        e164Number: '',
        phoneHash: '',
        pepper: '',
      },
      actionableAttestations: [],
      status: {
        isVerified: false,
        numAttestationsRemaining: NUM_ATTESTATIONS_REQUIRED,
        total: 0,
        completed: 0,
      },
      lastFetch: null,
      komenci: {
        errorTimestamps: [],
        unverifiedMtwAddress: null,
        serviceAvailable: false,
        sessionActive: false,
        sessionToken: '',
        callbackUrl: undefined,
        captchaToken: '',
        pepperFetchedByKomenci: false,
      },
    },
    feelessLastRevealAttempt: null,
  },
  app: {
    ...v6Schema.app,
    activeScreen: '',
    celoEducationUri: null,
    bitfyUrl: null,
    flowBtcUrl: null,
    shortVerificationCodesEnabled: false,
  },
  account: {
    ...v6Schema.account,
    backupRequiredTime: null,
    pictureUri: null,
    dailyLimitCusd: DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
  },
  home: {
    loading: false,
    notifications: {},
  },
  recipients: {
    phoneRecipientCache: {},
    valoraRecipientCache: {},
  },
  fiatExchanges: {
    lastUsedProvider: null,
    txHashToProvider: {},
  },
  send: {
    ...v6Schema.send,
    inviteRewardsEnabled: false,
    inviteRewardCusd: 1,
    inviteRewardWeeklyLimit: 5,
  },
}

export const v8Schema = {
  ...v7Schema,
  identity: _.omit(
    v7Schema.identity,
    'feelessAttestationCodes',
    'feelessProcessingInputCode',
    'feelessAcceptedAttestationCodes',
    'feelessNumCompleteAttestations',
    'feelessVerificationStatus',
    'verificationState',
    'feelessVerificationState',
    'feelessLastRevealAttempt'
  ),
  app: {
    ...v7Schema.app,
    hideVerification: false,
  },
  verify: {
    komenci: {
      errorTimestamps: [],
      unverifiedMtwAddress: null,
      sessionActive: false,
      sessionToken: '',
      callbackUrl: undefined,
      captchaToken: '',
    },
    status: {
      isVerified: false,
      numAttestationsRemaining: 3,
      total: 0,
      completed: 0,
      komenci: true,
    },
    actionableAttestations: [],
    retries: 0,
    currentState: idle(),
    komenciAvailable: KomenciAvailable.Unknown,
    withoutRevealing: false,
    TEMPORARY_override_withoutVerification: undefined,
  },
  account: {
    ...v7Schema.account,
    recoveringFromStoreWipe: false,
    accountToRecoverFromStoreWipe: undefined,
    dailyLimitRequestStatus: undefined,
    profileUploaded: false,
  },
}

export const v9Schema = {
  ...v8Schema,
  app: {
    ..._.omit(v8Schema.app, 'pontoEnabled', 'kotaniEnabled', 'bitfyUrl', 'flowBtcUrl'),
    showRaiseDailyLimitTarget: undefined,
    walletConnectEnabled: false,
    rewardsABTestThreshold: '0xffffffffffffffffffffffffffffffffffffffff',
    rewardsPercent: 5,
    rewardsStartDate: 1622505600000,
    rewardsMax: 1000,
    ranVerificationMigrationAt: null,
    logPhoneNumberTypeEnabled: false,
  },
  walletConnect: {
    pairings: [],
    sessions: [],
    pendingSessions: [],
    pendingActions: [],
  },
  fiatExchanges: {
    ...v8Schema.fiatExchanges,
    providerLogos: {},
  },
  identity: {
    ...v8Schema.identity,
    attestationInputStatus: [
      CodeInputStatus.Inputting,
      CodeInputStatus.Disabled,
      CodeInputStatus.Disabled,
    ],
  },
}

// Skipping to v13 to keep in sync with migrations.ts
export const v13Schema = {
  ...v9Schema,
  _persist: { version: 13, rehydrated: true },
  identity: {
    ..._.omit(
      v9Schema.identity,
      'attestationCodes',
      'acceptedAttestationCodes',
      'attestationInputStatus',
      'numCompleteAttestations',
      'verificationStatus',
      'hasSeenVerificationNux',
      'lastRevealAttempt'
    ),
  },
  verify: {
    ..._.omit(
      v9Schema.verify,
      'TEMPORARY_override_withoutVerification',
      'withoutRevealing',
      'retries'
    ),
    seenVerificationNux: false,
    revealStatuses: {},
    attestationCodes: [],
    acceptedAttestationCodes: [],
    lastRevealAttempt: null,
    attestationInputStatus: [
      CodeInputStatus.Inputting,
      CodeInputStatus.Disabled,
      CodeInputStatus.Disabled,
    ],
  },
}

export const v14Schema = {
  ...v13Schema,
  _persist: {
    ...v13Schema._persist,
    version: 14,
  },
  networkInfo: {
    ...v13Schema.networkInfo,
    userLocationData: {
      countryCodeAlpha2: 'US',
      region: null,
      ipAddress: null,
    },
  },
  send: {
    ...v13Schema.send,
    showSendToAddressWarning: true,
  },
}

export const v15Schema = {
  ...v14Schema,
  _persist: {
    ...v14Schema._persist,
    version: 15,
  },
  // Here we go back to the v9 test schema (i.e. migration 12, app version 1.14.3), because we reverted the verification PR which broke completion rate
  identity: {
    ...v9Schema.identity,
  },
  verify: {
    ...v9Schema.verify,
  },
  recipients: {
    ...v14Schema.recipients,
    rewardsSenders: [],
  },
}

export const v16Schema = {
  ...v15Schema,
  _persist: {
    ...v14Schema._persist,
    version: 16,
  },
  app: {
    ...v15Schema.app,
    celoEuroEnabled: false,
    googleMobileServicesAvailable: undefined,
    huaweiMobileServicesAvailable: undefined,
  },
  localCurrency: {
    ...v15Schema.localCurrency,
    exchangeRates: {
      [Currency.Celo]: '3',
      [Currency.Euro]: '2',
      [Currency.Dollar]: v15Schema.localCurrency.exchangeRate,
    },
    exchangeRate: undefined,
    fetchRateFailed: false,
  },
  stableToken: {
    ...v15Schema.stableToken,
    balances: {
      [Currency.Euro]: null,
      [Currency.Dollar]: v15Schema.stableToken.balance ?? null,
    },
    balance: undefined,
  },
  send: {
    ...v15Schema.send,
    lastUsedCurrency: Currency.Dollar,
  },
  exchange: {
    ...v15Schema.exchange,
    exchangeRates: null,
    exchangeRatePair: undefined,
  },
}

export const v17Schema = {
  ...v16Schema,
  _persist: {
    ...v16Schema._persist,
    version: 17,
  },
  app: {
    ...v16Schema.app,
    rewardsMin: 10,
    pincodeUseExpandedBlocklist: true,
    rewardPillText: { en: 'Earn', pt: 'Ganhar', es: 'Gana' },
  },
  fiatExchanges: _.omit(v16Schema.fiatExchanges, 'lastUsedProvider'),
  verify: {
    ...v16Schema.verify,
    komenciConfig: {
      useLightProxy: false,
      allowedDeployers: [],
    },
  },
  recipients: {
    ...v16Schema.recipients,
    inviteRewardsSenders: [],
  },
}

export const v18Schema = {
  ...v17Schema,
  _persist: {
    ...v17Schema._persist,
    version: 18,
  },
  app: {
    ...v17Schema.app,
    cashInButtonExpEnabled: false,
    walletConnectV1Enabled: false,
    walletConnectV2Enabled: false,
  },
  walletConnect: {
    v1: {
      pendingActions: [],
      sessions: [],
      pendingSessions: [],
    },
    v2: _.omit(v17Schema.walletConnect, 'pairings'),
  },
}

export const v19Schema = {
  ...v18Schema,
  _persist: {
    ...v18Schema._persist,
    version: 19,
  },
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        name: 'Celo Dollars',
        address: mockCusdAddress,
        symbol: 'cUSD',
        decimals: 18,
        imageUrl: '',
        usdPrice: '1',
        balance: '10',
        isCoreToken: true,
      },
      [mockCeurAddress]: {
        name: 'Celo Euros',
        address: mockCeurAddress,
        symbol: 'cEUR',
        decimals: 18,
        imageUrl: '',
        usdPrice: '1.2',
        balance: '20',
        isCoreToken: true,
      },
      [mockCeloAddress]: {
        name: 'Celo',
        address: mockCeloAddress,
        symbol: 'CELO',
        decimals: 18,
        imageUrl: '',
        usdPrice: '5',
        balance: '0',
        isCoreToken: true,
      },
      [mockTestTokenAddress]: {
        name: 'Test Token',
        address: mockTestTokenAddress,
        symbol: 'TT',
        decimals: 10,
        imageUrl: '',
        usdPrice: '0.1234',
        balance: '0',
      },
      '0x17700282592D6917F6A73D0bF8AcCf4D578c131e': {
        name: 'Moola',
        address: '0x17700282592D6917F6A73D0bF8AcCf4D578c131e',
        symbol: 'MOO',
        decimals: 18,
        imageUrl: '',
        usdPrice: '4',
        balance: '0',
      },
    },
    loading: false,
    error: false,
    lastSuccessfulFetch: Date.now(),
  },
}

export const v20Schema = {
  ...v19Schema,
  _persist: {
    ...v19Schema._persist,
    version: 20,
  },
  app: {
    ...v19Schema.app,
    multiTokenShowHomeBalances: false,
    multiTokenUseSendFlow: false,
    multiTokenUseUpdatedFeed: false,
  },
}

export const v21Schema = {
  ...v20Schema,
  _persist: {
    ...v20Schema._persist,
    version: 21,
  },
  account: {
    ...v20Schema.account,
    kycStatus: undefined,
  },
}

export const v22Schema = {
  ...v21Schema,
  _persist: {
    ...v21Schema._persist,
    version: 22,
  },
  app: {
    ...v21Schema.app,
    language: undefined,
  },
  i18n: {
    language: v21Schema.app.language,
    allowOtaTranslations: false,
    otaTranslationsLastUpdate: 0,
    otaTranslationsAppVersion: '0',
    otaTranslationsLanguage: '',
  },
}

export const v23Schema = {
  ...v22Schema,
  _persist: {
    ...v22Schema._persist,
    version: 23,
  },
  app: {
    ...v22Schema.app,
    linkBankAccountEnabled: false,
  },
  fees: {
    estimates: {
      [mockCusdAddress]: {
        ['send']: {
          usdFee: '0.02',
          lastUpdated: 500,
          loading: false,
          error: false,
        },
        ['invite']: {
          usdFee: '0.04',
          lastUpdated: 500,
          loading: false,
          error: false,
        },
        ['exchange']: undefined,
        ['reclaim-escrow']: undefined,
        ['register-dek']: undefined,
      },
    },
  },
}

export const v24Schema = {
  ...v23Schema,
  _persist: {
    ...v23Schema._persist,
    version: 24,
  },
  app: {
    ...v23Schema.app,
    sentryTracesSampleRate: 0.2,
  },
  transactions: {
    ...v23Schema.transactions,
    transactions: [],
  },
  invite: undefined,
}

export const v25Schema = {
  ...v24Schema,
  _persist: {
    ...v24Schema._persist,
    version: 25,
  },
  app: {
    ...v24Schema.app,
    sentryTracesSampleRate: 0.2,
  },
  tokens: {
    ...v24Schema.tokens,
    tokenBalances: {
      [mockCusdAddress]: {
        name: 'Celo Dollars',
        address: mockCusdAddress,
        symbol: 'cUSD',
        decimals: 18,
        imageUrl: '',
        usdPrice: '1',
        balance: '10',
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeurAddress]: {
        name: 'Celo Euros',
        address: mockCeurAddress,
        symbol: 'cEUR',
        decimals: 18,
        imageUrl: '',
        usdPrice: '1.2',
        balance: '20',
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeloAddress]: {
        name: 'Celo',
        address: mockCeloAddress,
        symbol: 'CELO',
        decimals: 18,
        imageUrl: '',
        usdPrice: '5',
        balance: '0',
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockTestTokenAddress]: {
        name: 'Test Token',
        address: mockTestTokenAddress,
        symbol: 'TT',
        decimals: 10,
        imageUrl: '',
        usdPrice: '0.1234',
        balance: '0',
        priceFetchedAt: Date.now(),
      },
      '0x17700282592D6917F6A73D0bF8AcCf4D578c131e': {
        name: 'Moola',
        address: '0x17700282592D6917F6A73D0bF8AcCf4D578c131e',
        symbol: 'MOO',
        decimals: 18,
        imageUrl: '',
        usdPrice: '4',
        balance: '0',
        priceFetchedAt: Date.now(),
      },
    },
    lastSuccessfulFetch: Date.now(),
  },
}

export const v26Schema = {
  ...v25Schema,
  _persist: {
    ...v25Schema._persist,
    version: 26,
  },
  app: {
    ...v25Schema.app,
    rampCashInButtonExpEnabled: false,
  },
}

export const v27Schema = {
  ...v26Schema,
  _persist: {
    ...v26Schema._persist,
    version: 27,
  },
  app: {
    ...v26Schema.app,

    superchargeButtonType: SuperchargeButtonType.PillRewards,
  },
}

export const v28Schema = {
  ...v27Schema,
  _persist: {
    ...v27Schema._persist,
    version: 28,
  },
  app: {
    ...v27Schema.app,
    dappListApiUrl: null,
  },
}

export const v29Schema = {
  ...v28Schema,
  _persist: {
    ...v28Schema._persist,
    version: 29,
  },
  web3: {
    ...v28Schema.web3,
    fornoMode: true,
    hadFornoDisabled: true,
  },
}

export const v30Schema = {
  ...v29Schema,
  _persist: {
    ...v29Schema._persist,
    version: 30,
  },
  app: {
    ...v29Schema.app,
    sentryNetworkErrors: [],
  },
}

export const v31Schema = {
  ...v30Schema,
  _persist: {
    ...v30Schema._persist,
    version: 31,
  },
  app: {
    ...v30Schema.app,
    biometryEnabled: false,
    supportedBiometryType: null,
    linkBankAccountStepTwoEnabled: false,
  },
  account: {
    ...v30Schema.account,
    isSettingPin: undefined,
  },
}

export const v32Schema = {
  ...v31Schema,
  _persist: {
    ...v31Schema._persist,
    version: 32,
  },
  account: {
    ...v31Schema.account,
    hasLinkedBankAccount: false,
  },
}

export const v33Schema = {
  ...v32Schema,
  _persist: {
    ...v32Schema._persist,
    version: 33,
  },
}

export const v34Schema = {
  ...v33Schema,
  _persist: {
    ...v33Schema._persist,
    version: 34,
  },
  app: {
    ...v33Schema.app,
    superchargeApy: 25,
    superchargeTokens: [
      {
        token: 'cUSD',
        minBalance: 10,
        maxBalance: 1000,
      },
    ],
    rewardsPercent: undefined,
    rewardsStartDate: undefined,
    rewardsMax: undefined,
    rewardsMin: undefined,
    rewardsABTestThreshold: undefined,
  },
}

export const v35Schema = {
  ...v34Schema,
  _persist: {
    ...v34Schema._persist,
    version: 35,
  },
  supercharge: {
    loading: false,
    error: false,
  },
}

export const v36Schema = {
  ...v35Schema,
  _persist: {
    ...v35Schema._persist,
    version: 36,
  },
  account: {
    ...v35Schema.account,
    finclusiveKycStatus: FinclusiveKycStatus.NotSubmitted,
  },
  app: {
    ...v35Schema.app,
    maxNumRecentDapps: 0,
    recentDapps: [],
  },
}

export const v37Schema = {
  ...v36Schema,
  _persist: {
    ...v36Schema._persist,
    version: 37,
  },
  app: {
    ...v36Schema.app,
    showPriceChangeIndicatorInBalances: false,
  },
}

export const v38Schema = {
  ...v37Schema,
  _persist: {
    ...v37Schema._persist,
    version: 38,
  },
  app: {
    ...v37Schema.app,
    skipVerification: false,
  },
}

export const v39Schema = {
  ...v38Schema,
  _persist: {
    ...v38Schema._persist,
    version: 39,
  },
  app: {
    ...v38Schema.app,
    paymentDeepLinkHandler: PaymentDeepLinkHandler.Disabled,
  },
}

export const v40Schema = {
  ..._.omit(v39Schema, ['medianator', 'invite']),
  _persist: {
    ...v39Schema._persist,
    version: 40,
  },
  account: {
    ..._.omit(v39Schema.account, [
      'pincodeSet',
      'isSettingPin',
      'backupDelayedTime',
      'socialBackupCompleted',
      'incomingPaymentRequests',
      'outgoingPaymentRequests',
      'dismissedInviteFriends',
      'dismissedEarnRewards',
    ]),
  },
  alert: null,
  app: {
    ..._.omit(v39Schema.app, [
      'loading',
      'inviteCodeEntered',
      'error',
      'dismissErrorAfter',
      'language',
      'doingBackupFlow',
      'message',
      'dismissMessageAfter',
      'lockWithPinEnabled',
      'rewardsPercent',
      'rewardsStartDate',
      'rewardsMax',
      'rewardsMin',
      'rewardsABTestThreshold',
      'shortVerificationCodesEnabled',
      'walletConnectEnabled',
    ]),
    activeScreen: 'Main',
  },
  cloudFunctionsApi: {},
  escrow: {
    ..._.omit(v39Schema.escrow, ['suggestedFee']),
  },
  exchange: {
    ..._.omit(v39Schema.exchange, ['exchangeRatePair']),
    history: {
      ..._.omit(v39Schema.exchange.history, ['isLoading']),
    },
  },
  home: {
    ...v39Schema.home,
    notifications: {},
  },
  identity: {
    ..._.omit(v39Schema.identity, [
      'verificationFailed',
      'startedVerification',
      'isLoadingImportContacts',
      'contactMappingProgress',
      'attestationsCode',
    ]),
  },
  localCurrency: {
    ..._.omit(v39Schema.localCurrency, ['exchangeRate', 'fetchRateFailed']),
  },
  recipients: {
    ..._.omit(v39Schema.recipients, ['recipientCache']),
  },
  send: {
    ..._.omit(v39Schema.send, ['recipientCache']),
  },
  stableToken: {
    ..._.omit(v39Schema.stableToken, ['balance']),
  },
  tokens: {
    ..._.omit(v39Schema.tokens, ['lastSuccessfulFetch']),
  },
  web3: {
    ..._.omit(v39Schema.web3, ['commentKey', 'gasPriceLastUpdated', 'contractKitReady']),
  },
}

export const v41Schema = {
  ...v40Schema,
  _persist: {
    ...v40Schema._persist,
    version: 41,
  },
  app: {
    ...v40Schema.app,
    dappsWebViewEnabled: false,
  },
}

export const v42Schema = {
  ...v41Schema,
  _persist: {
    ...v41Schema._persist,
    version: 42,
  },
  app: {
    ...v41Schema.app,
    skipProfilePicture: false,
  },
}

export const v43Schema = {
  ...v42Schema,
  _persist: {
    ...v42Schema._persist,
    version: 43,
  },
  account: {
    ...v42Schema.account,
    finclusiveRegionSupported: false,
  },
  app: {
    ...v42Schema.app,
    activeDapp: null,
  },
}

export const v44Schema = {
  ...v43Schema,
  _persist: {
    ...v43Schema._persist,
    version: 44,
  },
  app: {
    ...v43Schema.app,
    finclusiveUnsupportedStates: ['NY', 'TX'],
  },
  account: {
    ...v43Schema.account,
    finclusiveRegionSupported: false,
  },
}

export const v45Schema = {
  ...v44Schema,
  _persist: {
    ...v44Schema._persist,
    version: 45,
  },
  transactions: {
    ...v44Schema.transactions,
    inviteTransactions: {},
  },
}

export const v46Schema = {
  ...v45Schema,
  _persist: {
    ...v45Schema._persist,
    version: 46,
  },
}

export const v47Schema = {
  ...v46Schema,
  _persist: {
    ...v46Schema._persist,
    version: 47,
  },
  app: {
    ..._.omit(
      v46Schema.app,
      'multiTokenUseSendFlow',
      'multiTokenUseUpdatedFeed',
      'multiTokenShowHomeBalances'
    ),
  },
}

export const v48Schema = {
  ..._.omit(v47Schema, 'cloudFunctionsApi'),
  _persist: {
    ...v47Schema._persist,
    version: 48,
  },
  supercharge: {
    ...v47Schema.supercharge,
    fetchAvailableRewardsLoading: false,
    fetchAvailableRewardsError: false,
    availableRewards: [],
  },
}

export const v49Schema = {
  ...v48Schema,
  _persist: {
    ...v48Schema._persist,
    version: 49,
  },
  account: {
    ...v48Schema.account,
    dismissedKeepSupercharging: false,
    dismissedStartSupercharging: false,
  },
}

export const v50Schema = {
  ...v49Schema,
  _persist: {
    ...v49Schema._persist,
    version: 50,
  },
  app: {
    ..._.omit(v49Schema.app, ['walletConnectV2Enabled']),
  },
  walletConnect: {
    ..._.omit(v49Schema.walletConnect, ['v2']),
  },
}

export const v51Schema = {
  ...v50Schema,
  _persist: {
    ...v50Schema._persist,
    version: 51,
  },
  app: {
    ...v50Schema.app,
    celoWithdrawalEnabledInExchange: true,
  },
}

export function getLatestSchema(): Partial<RootState> {
  return v51Schema as Partial<RootState>
}
