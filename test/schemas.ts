import _ from 'lodash'
import {
  FinclusiveKycStatus,
  PincodeType,
  RecoveryPhraseInOnboardingStatus,
} from 'src/account/reducer'
import { AppState, MultichainBetaStatus } from 'src/app/actions'
import { Dapp } from 'src/dapps/types'
import { FeeEstimates } from 'src/fees/reducer'
import { SendingFiatAccountStatus } from 'src/fiatconnect/slice'
import { KeylessBackupDeleteStatus, KeylessBackupStatus } from 'src/keylessBackup/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { Position } from 'src/positions/types'
import { updateCachedQuoteParams } from 'src/redux/migrations'
import { RootState } from 'src/redux/store'
import { Network, NetworkId, StandbyTransaction, TokenTransaction } from 'src/transactions/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'
import {
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockPositionsLegacy,
  mockPositions,
  mockTestTokenAddress,
  mockShortcuts,
} from 'test/values'

export const DEFAULT_DAILY_PAYMENT_LIMIT_CUSD_LEGACY = 1000

function updateTestTokenInfo(tokenInfo: any): any {
  const isNative = tokenInfo.symbol === 'CELO'
  return {
    ...tokenInfo,
    tokenId: `celo-alfajores:${isNative ? 'native' : tokenInfo.address}`,
    isNative,
    networkId: NetworkId['celo-alfajores'],
  }
}

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
        numAttestationsRemaining: 3,
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
        numAttestationsRemaining: 3,
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
    dailyLimitCusd: DEFAULT_DAILY_PAYMENT_LIMIT_CUSD_LEGACY,
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
    currentState: {
      type: 'Idle',
    },
    komenciAvailable: 'UNKNOWN',
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
    attestationInputStatus: ['Inputting', 'Disabled', 'Disabled'],
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
    attestationInputStatus: ['Inputting', 'Disabled', 'Disabled'],
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

    superchargeButtonType: 'PILL_REWARDS',
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
    paymentDeepLinkHandler: '',
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

export const v52Schema = {
  ...v51Schema,
  _persist: {
    ...v51Schema._persist,
    version: 52,
  },
  app: {
    ...v51Schema.app,
    fiatConnectCashInEnabled: false,
    fiatConnectCashOutEnabled: false,
  },
}

export const v53Schema = {
  ..._.omit(v52Schema, 'geth'),
  _persist: {
    ...v52Schema._persist,
    version: 53,
  },
  account: _.omit(v52Schema.account, 'promptFornoIfNeeded', 'retryVerificationWithForno'),
  web3: _.omit(
    v52Schema.web3,
    'syncProgress',
    'latestBlockNumber',
    'fornoMode',
    'hadFornoDisabled'
  ),
}

export const v54Schema = {
  ...v53Schema,
  _persist: {
    ...v53Schema._persist,
    version: 54,
  },
  dapps: {
    dappsWebViewEnabled: v53Schema.app.dappsWebViewEnabled,
    activeDapp: v53Schema.app.activeDapp,
    maxNumRecentDapps: v53Schema.app.maxNumRecentDapps,
    recentDapps: v53Schema.app.recentDapps,
    dappListApiUrl: v53Schema.app.dappListApiUrl,
  },
  app: _.omit(
    v53Schema.app,
    'dappsWebViewEnabled',
    'activeDapp',
    'maxNumRecentDapps',
    'recentDapps',
    'dappListApiUrl'
  ),
}

export const v55Schema = {
  ...v54Schema,
  _persist: {
    ...v54Schema._persist,
    version: 55,
  },
  dapps: {
    ...v54Schema.dapps,
    dappsList: [],
    dappsListLoading: false,
    dappsListError: null,
    dappsCategories: [],
  },
}

export const v56Schema = {
  ...v55Schema,
  _persist: {
    ...v55Schema._persist,
    version: 56,
  },
  dapps: {
    ...v55Schema.dapps,
    dappConnectInfo: 'default',
  },
}

export const v57Schema = {
  ...v56Schema,
  _persist: {
    ...v56Schema._persist,
    version: 57,
  },
  app: {
    ...v56Schema.app,
    visualizeNFTsEnabledInHomeAssetsPage: false,
  },
}

export const v58Schema = {
  ...v57Schema,
  _persist: {
    ...v57Schema._persist,
    version: 58,
  },
  app: {
    ...v57Schema.app,
    coinbasePayEnabled: false,
  },
}

export const v59Schema = {
  ...v58Schema,
  _persist: {
    ...v58Schema._persist,
    version: 59,
  },
}

export const v60Schema = {
  ...v59Schema,
  _persist: {
    ...v59Schema._persist,
    version: 60,
  },
  fiatConnect: {
    quotes: [],
    quotesLoading: false,
    quotesError: null,
  },
}

export const v61Schema = {
  ...v60Schema,
  _persist: {
    ...v60Schema._persist,
    version: 61,
  },
  app: {
    ...v60Schema.app,
    showSwapMenuInDrawerMenu: false,
  },
}

export const v62Schema = {
  ...v61Schema,
  _persist: {
    ...v61Schema._persist,
    version: 62,
  },
  fiatConnect: {
    ...v61Schema.fiatConnect,
    transfer: null,
  },
}

export const v63Schema = {
  ...v62Schema,
  _persist: {
    ...v62Schema._persist,
    version: 63,
  },
  app: {
    ..._.omit(v62Schema.app, 'superchargeTokens'),
    superchargeTokenConfigByToken: {
      [mockCusdAddress]: {
        minBalance: 10,
        maxBalance: 1000,
      },
      [mockCeurAddress]: {
        minBalance: 10,
        maxBalance: 1000,
      },
    },
  },
}

export const v64Schema = {
  ...v63Schema,
  _persist: {
    ...v63Schema._persist,
    version: 64,
  },
  fiatConnect: {
    ...v63Schema.fiatConnect,
    providers: null,
  },
}

export const v65Schema = {
  ...v64Schema,
  _persist: {
    ...v64Schema._persist,
    version: 64,
  },
  fees: {
    ...v64Schema.fees,
    estimates: Object.entries(v64Schema.fees.estimates).reduce((acc, [address, estimate]) => {
      return {
        ...acc,
        [address]: {
          ...estimate,
          swap: undefined,
        },
      }
    }, {}),
  },
}

export const v66Schema = {
  ...v65Schema,
  _persist: {
    ...v65Schema._persist,
    version: 66,
  },
  fiatConnect: {
    ...v65Schema.fiatConnect,
    cachedFiatAccountUses: [],
    attemptReturnUserFlowLoading: false,
  },
}

export const v67Schema = {
  ...v66Schema,
  _persist: {
    ...v66Schema._persist,
    version: 67,
  },
  fiatConnect: {
    ...v66Schema.fiatConnect,
    selectFiatConnectQuoteLoading: false,
  },
}

export const v68Schema = {
  ...v67Schema,
  _persist: {
    ...v67Schema._persist,
    version: 68,
  },
  app: _.omit(
    v67Schema.app,
    'linkBankAccountEnabled',
    'linkBankAccountStepTwoEnabled',
    'finclusiveUnsupportedStates'
  ),
  account: _.omit(
    v67Schema.account,
    'hasLinkedBankAccount',
    'finclusiveRegionSupported',
    'finclusiveKycStatus',
    'kycStatus'
  ),
}
export const v69Schema = {
  ...v68Schema,
  _persist: {
    ...v68Schema._persist,
    version: 69,
  },
  recipients: {
    ...v68Schema.recipients,
    coinbasePaySenders: [],
  },
}

export const v70Schema = {
  ...v69Schema,
  _persist: {
    ...v69Schema._persist,
    version: 70,
  },
  app: {
    ...v69Schema.app,
    createAccountCopyTestType: 'ACCOUNT',
  },
}

export const v71Schema = {
  ...v70Schema,
  _persist: {
    ...v70Schema._persist,
    version: 71,
  },
  app: {
    ...v70Schema.app,
    maxSwapSlippagePercentage: 2,
    swapFeeEnabled: false,
    swapFeePercentage: 0.743,
  },
}

export const v72Schema = {
  ...v71Schema,
  _persist: {
    ...v71Schema._persist,
    version: 72,
  },
  app: {
    ...v71Schema.app,
    shouldShowRecoveryPhraseInSettings: false,
  },
}

export const v73Schema = {
  ...v72Schema,
  _persist: {
    ...v72Schema._persist,
    version: 73,
  },
  app: {
    ...v72Schema.app,
    inviteMethod: 'ESCROW',
  },
}

export const v74Schema = {
  ...v73Schema,
  _persist: {
    ...v73Schema._persist,
    version: 74,
  },
  identity: _.omit(v73Schema.identity, 'matchedContacts'),
}

export const v75Schema = {
  ...v74Schema,
  _persist: {
    ...v74Schema._persist,
    version: 75,
  },
  app: _.omit(v74Schema.app, 'showRaiseDailyLimitTarget'),
  account: _.omit(v74Schema.account, 'dailyLimitRequestStatus', 'dailyLimitCusd'),
}

export const v76Schema = {
  ...v75Schema,
  _persist: {
    ...v75Schema._persist,
    version: 76,
  },
  app: {
    ...v75Schema.app,
    showGuidedOnboardingCopy: false,
  },
}

export const v77Schema = {
  ...v76Schema,
  _persist: {
    ...v76Schema._persist,
    version: 77,
  },
  app: {
    ...v76Schema.app,
    centralPhoneVerificationEnabled: false,
  },
}

export const v78Schema = {
  ...v77Schema,
  _persist: {
    ...v77Schema._persist,
    version: 78,
  },
  fiatConnect: {
    ...v77Schema.fiatConnect,
    sendingFiatAccount: false,
  },
}

export const v79Schema = {
  ...v78Schema,
  _persist: {
    ...v78Schema._persist,
    version: 79,
  },
  fiatConnect: {
    ..._.omit(v78Schema.fiatConnect, 'sendingFiatAccount'),
    sendingFiatAccountStatus: SendingFiatAccountStatus.NotSending,
  },
}

export const v80Schema = {
  ...v79Schema,
  _persist: {
    ...v79Schema._persist,
    version: 80,
  },
  fiatConnect: {
    ...v79Schema.fiatConnect,
    kycTryAgainLoading: false,
  },
}

export const v81Schema = {
  ...v80Schema,
  _persist: {
    ...v80Schema._persist,
    version: 81,
  },
  app: {
    ...v80Schema.app,
    phoneNumberVerified: false,
  },
}

export const v82Schema = {
  ...v81Schema,
  _persist: {
    ...v81Schema._persist,
    version: 82,
  },
  swap: {
    swapState: 'quote',
    swapInfo: null,
    swapUserInput: null,
  },
}

export const v83Schema = {
  ...v82Schema,
  _persist: {
    ...v82Schema._persist,
    version: 83,
  },
  fiatConnect: {
    ...v82Schema.fiatConnect,
    cachedQuoteParams: {},
  },
}

export const v84Schema = {
  ...v83Schema,
  _persist: {
    ...v83Schema._persist,
    version: 84,
  },
  fiatConnect: {
    ...v83Schema.fiatConnect,
    schemaCountryOverrides: {},
  },
}

export const v85Schema = {
  ...v84Schema,
  _persist: {
    ...v84Schema._persist,
    version: 85,
  },
  app: _.omit(v82Schema.app, 'swapFeeEnabled', 'swapFeePercentage'),
}

export const v86Schema = {
  ...v85Schema,
  _persist: {
    ...v85Schema._persist,
    version: 86,
  },
}

export const v87Schema = {
  ...v86Schema,
  _persist: {
    ...v86Schema._persist,
    version: 87,
  },
  app: {
    ...v86Schema.app,
    inviterAddress: null,
  },
}

export const v88Schema = {
  ...v87Schema,
  _persist: {
    ...v87Schema._persist,
    version: 88,
  },
  app: {
    ...v87Schema.app,
    networkTimeoutSeconds: 30,
  },
}

export const v89Schema = {
  ...v88Schema,
  _persist: {
    ...v88Schema._persist,
    version: 89,
  },
  app: _.omit(v88Schema.app, 'superchargeButtonType'),
}

export const v90Schema = {
  ...v89Schema,
  _persist: {
    ...v89Schema._persist,
    version: 90,
  },
  app: _.omit(v89Schema.app, 'biometryEnabled'),
}

export const v91Schema = {
  ...v90Schema,
  _persist: {
    ...v90Schema._persist,
    version: 91,
  },
  fiatConnect: {
    ...v90Schema.fiatConnect,
    personaInProgress: false,
  },
}

export const v92Schema = {
  ...v91Schema,
  _persist: {
    ...v91Schema._persist,
    version: 92,
  },
  app: _.omit(v90Schema.app, 'celoWithdrawalEnabledInExchange'),
}

export const v93Schema = {
  ...v92Schema,
  _persist: {
    ...v92Schema._persist,
    version: 93,
  },
  fiatConnect: {
    ...v92Schema.fiatConnect,
    transfer: null,
  },
}

export const v94Schema = {
  ...v93Schema,
  _persist: {
    ...v93Schema._persist,
    version: 94,
  },
  walletConnect: {
    ...v93Schema.walletConnect,
    v2: {
      sessions: [],
      pendingSessions: [],
      pendingActions: [],
    },
  },
  app: {
    ...v93Schema.app,
    walletConnectV2Enabled: true,
  },
}

export const v95Schema = {
  ...v94Schema,
  _persist: {
    ...v94Schema._persist,
    version: 95,
  },
  fiatConnect: {
    ...v94Schema.fiatConnect,
    providers: null,
  },
}

export const v96Schema = {
  ...v95Schema,
  _persist: {
    ...v95Schema._persist,
    version: 96,
  },
  app: _.omit(v95Schema.app, 'paymentDeepLinkHandler'),
}

export const v97Schema = {
  ...v96Schema,
  _persist: {
    ...v96Schema._persist,
    version: 97,
  },
  dapps: {
    ...v96Schema.dapps,
    dappFavoritesEnabled: false,
    favoriteDapps: [],
  },
}

export const v98Schema = {
  ...v97Schema,
  _persist: {
    ...v97Schema._persist,
    version: 98,
  },
  app: {
    ...v97Schema.app,
    celoNewsEnabled: false,
  },
}

export const v99Schema = {
  ...v98Schema,
  _persist: {
    ...v98Schema._persist,
    version: 99,
  },
  dapps: {
    ..._.omit(v98Schema.dapps, 'recentDapps', 'favoriteDapps'),
    recentDappIds: v98Schema.dapps.recentDapps?.map((recentDapp: Dapp) => recentDapp.id),
    favoriteDappIds: v98Schema.dapps.favoriteDapps?.map((favoriteDapp: Dapp) => favoriteDapp.id),
  },
}

export const v100Schema = {
  ...v99Schema,
  _persist: {
    ...v99Schema._persist,
    version: 100,
  },
  app: {
    ..._.omit(v99Schema.app, 'celoNewsEnabled'),
    celoNews: { enabled: false, readMoreUrl: 'https://blog.celo.org' },
  },
}

export const v101Schema = {
  ...v100Schema,
  _persist: {
    ...v100Schema._persist,
    version: 101,
  },
  app: _.omit(v100Schema.app, 'inviteMethod', 'inviteModalVisible'),
  fees: {
    ...v100Schema.fees,
    estimates: Object.entries(v100Schema.fees.estimates as FeeEstimates).reduce(
      (acc, [address, estimate]) => {
        return {
          ...acc,
          [address]: _.omit(estimate, 'invite'),
        }
      },
      {}
    ),
  },
}

export const v102Schema = {
  ...v101Schema,
  _persist: {
    ...v101Schema._persist,
    version: 102,
  },
  app: _.omit(v101Schema.app, 'centralPhoneVerificationEnabled', 'hideVerification'),
}

export const v103Schema = {
  ..._.omit(v102Schema, 'verify'),
  _persist: {
    ...v102Schema._persist,
    version: 103,
  },
  identity: _.omit(
    v102Schema.identity,
    'attestationCodes',
    'acceptedAttestationCodes',
    'attestationInputStatus',
    'numCompleteAttestations',
    'verificationStatus',
    'lastRevealAttempt'
  ),
  app: _.omit(
    v102Schema.app,
    'komenciAllowedDeployers',
    'komenciUseLightProxy',
    'ranVerificationMigrationAt'
  ),
}

export const v104Schema = {
  ...(_.omit(v103Schema, ['goldToken', 'stableToken']) as any),
  _persist: {
    ...v103Schema._persist,
    version: 104,
  },
  account: {
    ...v103Schema.account,
    celoEducationCompleted: v103Schema.goldToken.educationCompleted,
  },
}

export const v105Schema = {
  ...v104Schema,
  _persist: {
    ...v104Schema._persist,
    version: 105,
  },
  web3: {
    ...v104Schema.web3,
    twelveWordMnemonicEnabled: false,
  },
}

export const v106Schema = {
  ...v105Schema,
  _persist: {
    ...v105Schema._persist,
    version: 106,
  },
  dapps: {
    ...v105Schema.dapps,
    dappsMinimalDisclaimerEnabled: false,
  },
}

export const v107Schema = {
  ...v106Schema,
  _persist: {
    ...v106Schema._persist,
    version: 107,
  },
  fiatConnect: {
    ...v106Schema.fiatConnect,
    cachedFiatAccountUses: v106Schema.fiatConnect.cachedFiatAccountUses.map((use: any) => ({
      ...use,
      cryptoType: use.cryptoType === Currency.Celo ? CiCoCurrency.CELO : use.cryptoType,
    })),
    cachedQuoteParams: updateCachedQuoteParams(v106Schema.fiatConnect.cachedQuoteParams),
  },
}

export const v108Schema = {
  ...v107Schema,
  _persist: {
    ...v107Schema._persist,
    version: 108,
  },
  fiatConnect: {
    ...v107Schema.fiatConnect,
    cachedTransfers: {},
  },
}

export const v109Schema = {
  ...v108Schema,
  _persist: {
    ...v108Schema._persist,
    version: 109,
  },
  app: {
    ...v108Schema.app,
    paymentDeepLinkHandler: '',
  },
}

export const v110Schema = {
  ...v109Schema,
  _persist: {
    ...v109Schema._persist,
    version: 110,
  },
  swap: {
    ...v109Schema.swap,
    guaranteedSwapPriceEnabled: false,
  },
}

export const v111Schema = {
  ...v110Schema,
  _persist: {
    ...v110Schema._persist,
    version: 111,
  },
  supercharge: {
    ...v110Schema.supercharge,
    superchargeV2Enabled: false,
    superchargeRewardContractAddress: '',
  },
}

export const v112Schema = {
  ...v111Schema,
  _persist: {
    ...v111Schema._persist,
    version: 112,
  },
  dapps: {
    ...v111Schema.dapps,
    dappsFilterEnabled: false,
    dappsSearchEnabled: false,
  },
}
export const v113Schema = {
  ...v112Schema,
  _persist: {
    ...v112Schema._persist,
    version: 113,
  },
  app: _.omit(
    v112Schema.app,
    'skipProfilePicture',
    'showGuidedOnboardingCopy',
    'createAccountCopyTestType'
  ),
}
export const v114Schema = {
  ...v113Schema,
  _persist: {
    ...v113Schema._persist,
    version: 114,
  },
  supercharge: {
    ...v113Schema.supercharge,
    superchargeV1Addresses: [],
  },
}

export const v115Schema = {
  ...v114Schema,
  _persist: {
    ...v114Schema._persist,
    version: 115,
  },
  app: {
    ...v114Schema.app,
    requireCPV: false,
  },
}

export const v116Schema = {
  ...v115Schema,
  _persist: {
    ...v115Schema._persist,
    version: 116,
  },
  account: {
    ...v115Schema.account,
    startOnboardingTime: undefined,
  },
}

export const v117Schema = {
  ...v116Schema,
  _persist: {
    ...v116Schema._persist,
    version: 117,
  },
  app: _.omit(v116Schema.app, 'cashInButtonExpEnabled'),
}

export const v118Schema = {
  ...v117Schema,
  _persist: {
    ...v116Schema._persist,
    version: 118,
  },
  send: {
    ..._.omit(v117Schema.send, 'inviteRewardsEnabled'),
    inviteRewardsVersion: 'none',
  },
}

export const v119Schema = {
  ...v118Schema,
  _persist: {
    ...v118Schema._persist,
    version: 119,
  },
  app: {
    ...v118Schema.app,
    hapticFeedbackEnabled: true,
  },
}

export const v120Schema = {
  ...v119Schema,
  _persist: {
    ...v119Schema._persist,
    version: 120,
  },
  app: {
    ...v119Schema.app,
    pushNotificationsEnabled: false,
  },
}

export const v121Schema = {
  ...v120Schema,
  _persist: {
    ...v120Schema._persist,
    version: 121,
  },
  app: {
    ...v120Schema.app,
    decentralizedVerificationEnabled: true,
  },
}

export const v122Schema = {
  ...v121Schema,
  _persist: {
    ...v121Schema._persist,
    version: 122,
  },
  account: {
    ...v121Schema.account,
    recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus.NotStarted,
  },
}

export const v123Schema = {
  ...v122Schema,
  _persist: {
    ...v122Schema._persist,
    version: 123,
  },
  dapps: _.omit(v122Schema.dapps, 'dappsFilterEnabled', 'dappsSearchEnabled'),
}

export const v124Schema = {
  ...v123Schema,
  _persist: {
    ...v123Schema._persist,
    version: 124,
  },
  positions: {
    positions: mockPositionsLegacy,
    status: 'idle',
  },
}

export const v125Schema = {
  ...v124Schema,
  _persist: {
    ...v124Schema._persist,
    version: 125,
  },
  app: {
    ...v124Schema.app,
    celoNews: {
      ..._.omit(v124Schema.app.celoNews, 'enabled'),
    },
  },
}

export const v126Schema = {
  ...v125Schema,
  _persist: {
    ...v125Schema._persist,
    version: 126,
  },
  app: {
    ...v125Schema.app,
    inAppReviewLastInteractionTimestamp: null,
  },
}

export const v127Schema = {
  ...v126Schema,
  _persist: {
    ...v126Schema._persist,
    version: 127,
  },
  keylessBackup: {
    google: {
      status: 'idle',
      idToken: null,
    },
  },
}

export const v128Schema = {
  ...v127Schema,
  _persist: {
    ...v127Schema._persist,
    version: 128,
  },
}

export const v129Schema = {
  ...v128Schema,
  _persist: {
    ...v128Schema._persist,
    version: 129,
  },
  dapps: {
    ...v128Schema.dapps,
    mostPopularDappIds: [],
  },
}

export const v130Schema = {
  ...v129Schema,
  _persist: {
    ...v129Schema._persist,
    version: 130,
  },
  swap: {
    ...v129Schema.swap,
    priceImpactWarningThreshold: 0.04,
  },
}

export const v131Schema = {
  ...v130Schema,
  _persist: {
    ...v130Schema._persist,
    version: 131,
  },
  dapps: {
    ...v130Schema.dapps,
    dappsList: v130Schema.dapps.dappsList.map(
      (dapp: Dapp | (Omit<Dapp, 'categories'> & { categoryId: string })) => {
        return {
          ...dapp,
          categories: 'categories' in dapp ? dapp.categories : [dapp.categoryId],
        }
      }
    ),
    activeDapp: v130Schema.dapps.activeDapp
      ? {
          ...v130Schema.dapps.activeDapp,
          categories: v130Schema.dapps.activeDapp.categories ?? [
            v130Schema.dapps.activeDapp.categoryId,
          ],
        }
      : null,
  },
}

export const v132Schema = {
  ...v131Schema,
  _persist: {
    ...v131Schema._persist,
    version: 132,
  },
  positions: {
    ...v131Schema.positions,
    positions: v131Schema.positions.positions.map((position: Position) => ({
      ...position,
      availableShortcutIds: [],
    })),
    shortcuts: [],
    shortcutsStatus: 'idle',
  },
}

export const v133Schema = {
  ...v132Schema,
  _persist: {
    ...v132Schema._persist,
    version: 133,
  },
  nfts: {
    nfts: [],
    nftsError: null,
    nftsLoading: false,
  },
}

export const v134Schema = {
  ...v133Schema,
  _persist: {
    ...v133Schema._persist,
    version: 134,
  },
  positions: {
    ...v133Schema.positions,
    previewApiUrl: null,
  },
}

export const v135Schema = {
  ...v134Schema,
  _persist: {
    ...v134Schema._persist,
    version: 135,
  },
  positions: {
    ...v134Schema.positions,
    triggeredShortcutsStatus: {},
  },
}

export const v136Schema = {
  ...v135Schema,
  _persist: {
    ...v135Schema._persist,
    version: 136,
  },
  account: _.omit(v135Schema.account, 'backupRequiredTime'),
}

export const v137Schema = {
  ...v136Schema,
  _persist: {
    ...v136Schema._persist,
    version: 137,
  },
  walletConnect: {
    sessions: v136Schema.walletConnect.v2.sessions,
    pendingActions: v136Schema.walletConnect.v2.pendingActions,
    pendingSessions: v136Schema.walletConnect.v2.pendingSessions,
  },
}

export const v138Schema = {
  ...v137Schema,
  _persist: {
    ...v137Schema._persist,
    version: 138,
  },
  keylessBackup: {
    ...v137Schema.keylessBackup,
    valoraKeyshare: null,
  },
}

export const v139Schema = {
  ...v138Schema,
  _persist: {
    ...v138Schema._persist,
    version: 139,
  },
  keylessBackup: {
    ...v138Schema.keylessBackup,
    backupStatus: KeylessBackupStatus.NotStarted,
  },
}

export const v140Schema = {
  ...v139Schema,
  _persist: {
    ...v139Schema._persist,
    version: 140,
  },
  keylessBackup: {
    ..._.omit(v139Schema.keylessBackup, 'google'),
    googleIdToken: null,
  },
}

export const v141Schema = {
  ...v140Schema,
  _persist: {
    ...v140Schema._persist,
    version: 141,
  },
  keylessBackup: {
    ...v140Schema.keylessBackup,
    torusKeyshare: null,
  },
}

export const v142Schema = {
  ...v141Schema,
  _persist: {
    ...v141Schema._persist,
    version: 142,
  },
  app: _.omit(v141Schema.app, 'shouldShowRecoveryPhraseInSettings'),
}

export const v143Schema = {
  ...v142Schema,
  _persist: {
    ...v142Schema._persist,
    version: 143,
  },
  account: {
    ...v142Schema.account,
    cloudBackupCompleted: false,
  },
}

export const v144Schema = {
  ...v143Schema,
  _persist: {
    ...v143Schema._persist,
    version: 144,
  },
  app: {
    ...v143Schema.app,
    pushNotificationRequestedUnixTime: 1692878055000,
  },
}

export const v145Schema = {
  ...v144Schema,
  _persist: {
    ...v144Schema._persist,
    version: 145,
  },
  transactions: {
    ...v144Schema.transactions,
    standbyTransactions: (v144Schema.transactions.standbyTransactions as StandbyTransaction[]).map(
      (tx) => {
        return { ...tx, network: Network.Celo }
      }
    ),
    transactions: (v144Schema.transactions.transactions as TokenTransaction[]).map((tx) => {
      const __typename = // @ts-ignore
        tx.__typename === 'TokenTransferV2'
          ? 'TokenTransferV3' // @ts-ignore
          : tx.__typename === 'NftTransferV2'
            ? 'NftTransferV3'
            : 'TokenExchangeV3'
      return {
        ...tx,
        __typename,
        network: Network.Celo,
      }
    }),
  },
}

export const v146Schema = {
  ...v145Schema,
  _persist: {
    ...v145Schema._persist,
    version: 146,
  },
  localCurrency: {
    ..._.omit(v145Schema.localCurrency, 'exchangeRates'),
    usdToLocalRate: v145Schema.localCurrency.exchangeRates[Currency.Dollar],
  },
}

export const v147Schema = {
  ...v146Schema,
  _persist: {
    ...v146Schema._persist,
    version: 147,
  },
  transactions: {
    ...v146Schema.transactions,
    standbyTransactions: (
      v146Schema.transactions.standbyTransactions as (StandbyTransaction & { network: Network })[]
    ).map((tx) => {
      return {
        ..._.omit(tx, 'network'),
        networkId: networkConfig.networkToNetworkId[tx.network],
      }
    }),
    transactions: (
      v146Schema.transactions.transactions as (TokenTransaction & { network: Network })[]
    ).map((tx) => {
      return {
        ..._.omit(tx, 'network'),
        networkId: networkConfig.networkToNetworkId[tx.network],
      }
    }),
  },
}

export const v148Schema = {
  ...v147Schema,
  _persist: {
    ...v147Schema._persist,
    version: 148,
  },
  app: {
    ...v146Schema.app,
    showNotificationSpotlight: true,
  },
}

export const v149Schema = {
  ...v148Schema,
  _persist: {
    ...v148Schema._persist,
    version: 149,
  },
}

export const v150Schema = {
  ...v149Schema,
  _persist: {
    ...v149Schema._persist,
    version: 150,
  },
  tokens: {
    ...v149Schema.tokens,
    tokenBalances: Object.values(v149Schema.tokens.tokenBalances).reduce(
      (acc: Record<string, any>, tokenInfo: any) => {
        const newTokenInfo = updateTestTokenInfo(tokenInfo)
        return {
          ...acc,
          [newTokenInfo.tokenId]: newTokenInfo,
        }
      },
      {}
    ),
  },
}

export const v151Schema = {
  ...v150Schema,
  _persist: {
    ...v150Schema._persist,
    version: 151,
  },
  tokens: {
    ...v150Schema.tokens,
    tokenBalances: Object.values(v150Schema.tokens.tokenBalances).reduce(
      (acc: Record<string, any>, tokenInfo: any) => {
        return {
          ...acc,
          [tokenInfo.tokenId]: {
            ..._.omit(tokenInfo, 'usdPrice'),
            priceUsd: tokenInfo.usdPrice,
          },
        }
      },
      {}
    ),
  },
}

export const v152Schema = {
  ...v151Schema,
  _persist: {
    ...v151Schema._persist,
    version: 152,
  },
}

export const v153Schema = {
  ...v152Schema,
  _persist: {
    ...v152Schema._persist,
    version: 153,
  },
  exchange: {
    ..._.omit(v152Schema.exchange, 'isLoading'),
  },
}

export const v154Schema = {
  ...v153Schema,
  _persist: {
    ...v153Schema._persist,
    version: 154,
  },
  exchange: {
    ..._.omit(v153Schema.exchange, 'exchangeRates', 'tobinTax'),
  },
}

export const v155Schema = {
  ...v154Schema,
  _persist: {
    ...v154Schema._persist,
    version: 155,
  },
  app: _.omit(v154Schema.app, 'paymentDeepLinkHandler'),
}

export const v156Schema = {
  ...v155Schema,
  _persist: {
    ...v155Schema._persist,
    version: 156,
  },
  app: _.omit(v155Schema.app, 'requireCPV'),
}

export const v157Schema = {
  ...v156Schema,
  _persist: {
    ...v156Schema._persist,
    version: 157,
  },
  transactions: {
    ...v156Schema.transactions,
    standbyTransactions: [],
    transactions: [],
  },
}

export const v158Schema = {
  ...v157Schema,
  _persist: {
    ...v157Schema._persist,
    version: 158,
  },
  app: _.omit(v157Schema.app, 'decentralizedVerificationEnabled'),
}

export const v159Schema = {
  ...v158Schema,
  _persist: {
    ...v158Schema._persist,
    version: 159,
  },
  transactions: _.omit(v158Schema.transactions, 'standbyTransactionsLegacy'),
}

export const v160Schema = {
  ...(_.omit(v159Schema, 'paymentRequest') as any),
  _persist: {
    ...v159Schema._persist,
    version: 160,
  },
}

export const v161Schema = {
  ...v160Schema,
  _persist: {
    ...v160Schema._persist,
    version: 161,
  },
  transactions: {
    ...v160Schema.transactions,
    standbyTransactions: v160Schema.transactions.standbyTransactions.map((tx: any) => {
      const { value, tokenId, tokenAddress, comment, hash, ...rest } = tx
      return {
        ...rest,
        __typename: 'TokenTransferV3', // only transfers were previously supported
        transactionHash: hash,
        amount: {
          value,
          tokenId,
          tokenAddress,
        },
        metadata: {
          comment,
        },
      }
    }),
    transactions: v160Schema.transactions.transactions.map((tx: any) => {
      return {
        ...tx,
        status: 'Complete',
      }
    }),
  },
}

export const v162Schema = {
  ...v161Schema,
  _persist: {
    ...v161Schema._persist,
    version: 162,
  },
  transactions: {
    ...v161Schema.transactions,
    standbyTransactions: v161Schema.transactions.standbyTransactions.filter((tx: any) => {
      return tx.status !== 'Complete'
    }),
  },
}

export const v163Schema = {
  ...v162Schema,
  _persist: {
    ...v162Schema._persist,
    version: 163,
  },
  send: {
    ..._.omit(v162Schema.send, 'lastUsedCurrency'),
    lastUsedTokenId: undefined,
  },
}

export const v164Schema = {
  ...v163Schema,
  _persist: {
    ...v163Schema._persist,
    version: 164,
  },
  app: _.omit(v162Schema.app, 'rampCashInButtonExpEnabled'),
}

export const v165Schema = {
  ...v164Schema,
  _persist: {
    ...v164Schema._persist,
    version: 165,
  },
  transactions: {
    ..._.omit(v164Schema.transactions, 'transactions'),
    transactionsByNetworkId: {
      [networkConfig.defaultNetworkId]: v164Schema.transactions.transactions,
    },
  },
}

export const v166Schema = {
  ...v165Schema,
  _persist: {
    ...v165Schema._persist,
    version: 166,
  },
  app: {
    ...v165Schema.app,
    hideHomeBalances: false,
  },
}

export const v167Schema = {
  ...v166Schema,
  _persist: {
    ...v166Schema._persist,
    version: 167,
  },
  app: {
    ...v166Schema.app,
    rampCashInButtonExpEnabled: false,
  },
}

export const v168Schema = {
  ...v167Schema,
  _persist: {
    ...v167Schema._persist,
    version: 168,
  },
  swap: _.omit(v167Schema.swap, 'swapUserInput'),
}

export const v169Schema = {
  ...v168Schema,
  _persist: {
    ...v168Schema._persist,
    version: 169,
  },
}

export const v170Schema = {
  ...v169Schema,
  _persist: {
    ...v169Schema._persist,
    version: 170,
  },
  supercharge: _.omit(v169Schema.supercharge, 'superchargeV2Enabled', 'superchargeV1Addresses'),
}

export const v171Schema = {
  ...v170Schema,
  _persist: {
    ...v170Schema._persist,
    version: 171,
  },
  app: {
    ...v170Schema.app,
    multichainBetaStatus: MultichainBetaStatus.NotSeen,
  },
}

export const v172Schema = {
  ...v171Schema,
  _persist: {
    ...v171Schema._persist,
    version: 172,
  },
  swap: {
    ..._.omit(v171Schema.swap, 'swapInfo'),
    currentSwap: null,
  },
}

export const v173Schema = {
  ...v172Schema,
  _persist: {
    ...v172Schema._persist,
    version: 173,
  },
  swap: _.omit(v172Schema.swap, 'swapState'),
}

export const v174Schema = {
  ...v173Schema,
  _persist: {
    ...v173Schema._persist,
    version: 174,
  },
  identity: {
    ...v173Schema.identity,
    addressToVerificationStatus: {},
  },
}

export const v175Schema = {
  ...v174Schema,
  _persist: {
    ...v174Schema._persist,
    version: 175,
  },
  tokens: {
    ...v174Schema.tokens,
    tokenBalances: _.mapValues(v174Schema.tokens.tokenBalances, (item: any) => {
      const newItem = _.omit(item, 'isCoreToken')
      if (item.isCoreToken !== undefined) {
        newItem.isFeeCurrency = item.isCoreToken
        newItem.canTransferWithComment = item.isCoreToken
      }
      return newItem
    }),
  },
}

export const v176Schema = {
  ...v175Schema,
  _persist: {
    ...v175Schema._persist,
    version: 176,
  },
  identity: {
    ...v175Schema.identity,
    lastSavedContactsHash: null,
  },
}

export const v177Schema = {
  ...v176Schema,
  _persist: {
    ...v176Schema._persist,
    version: 177,
  },
  swap: {
    ...v176Schema.swap,
    priceImpactWarningThreshold: v176Schema.swap.priceImpactWarningThreshold * 100,
  },
}

export const v178Schema = {
  ...v177Schema,
  _persist: {
    ...v177Schema._persist,
    version: 178,
  },
  swap: _.omit(v177Schema.swap, 'guaranteedSwapPriceEnabled'),
}

export const v179Schema = {
  ...v178Schema,
  _persist: {
    ...v178Schema._persist,
    version: 179,
  },
  priceHistory: {},
}

export const v180Schema = {
  ...v179Schema,
  _persist: {
    ...v179Schema._persist,
    version: 180,
  },
}

export const v181Schema = {
  ...v180Schema,
  _persist: {
    ...v180Schema._persist,
    version: 181,
  },
  nfts: {
    ...v180Schema.nfts,
    nfts: [],
  },
}

export const v182Schema = {
  ...v181Schema,
  _persist: {
    ...v181Schema._persist,
    version: 182,
  },
  tokens: {
    ...v181Schema.tokens,
    importedTokens: {},
  },
}

export const v183Schema = {
  ...v182Schema,
  _persist: {
    ...v182Schema._persist,
    version: 183,
  },
  home: { ...v182Schema.home, cleverTapInboxMessages: [] },
}

export const v184Schema = {
  ...v183Schema,
  _persist: {
    ...v183Schema._persist,
    version: 184,
  },
  swap: { ...v183Schema.swap, lastSwapped: [] },
}

export const v185Schema = {
  ...v184Schema,
  _persist: {
    ...v184Schema._persist,
    version: 185,
  },
  tokens: _.omit(v184Schema.tokens, 'importedTokens'),
}

export const v186Schema = {
  ...v185Schema,
  _persist: {
    ...v185Schema._persist,
    version: 186,
  },
  home: { ...v185Schema.home, hasVisitedHome: true },
  app: { ...v185Schema.app, pendingDeepLinks: [] },
}

export const v187Schema = {
  ...v186Schema,
  _persist: {
    ...v186Schema._persist,
    version: 187,
  },
  dapps: _.omit(
    v186Schema.dapps,
    'dappConnectInfo',
    'dappFavoritesEnabled',
    'dappsMinimalDisclaimerEnabled'
  ),
}

export const v188Schema = {
  ...v187Schema,
  _persist: {
    ...v187Schema._persist,
    version: 188,
  },
  app: _.omit(v187Schema.app, 'celoEuroEnabled', 'rewardPillText'),
  send: _.omit(v187Schema.send, 'inviteRewardWeeklyLimit', 'inviteRewardCusd'),
}

export const v189Schema = {
  ...v188Schema,
  _persist: {
    ...v188Schema._persist,
    version: 189,
  },
  home: { ...v188Schema.home, nftCelebration: null },
}

const currencyMapping: Record<string, LocalCurrencyCode> = {
  MYS: LocalCurrencyCode.MYR,
  SGP: LocalCurrencyCode.SGD,
  THI: LocalCurrencyCode.THB,
  TWN: LocalCurrencyCode.TWD,
  VNM: LocalCurrencyCode.VND,
}
export const v190Schema = {
  ...v189Schema,
  _persist: {
    ...v189Schema._persist,
    version: 190,
  },
  localCurrency: {
    ...v189Schema.localCurrency,
    preferredCurrencyCode:
      currencyMapping[v189Schema.localCurrency.preferredCurrencyCode] ??
      v189Schema.localCurrency.preferredCurrencyCode,
    fetchedCurrencyCode:
      currencyMapping[v189Schema.localCurrency.fetchedCurrencyCode] ??
      v189Schema.localCurrency.fetchedCurrencyCode,
  },
}

export const v191Schema = {
  ...v190Schema,
  _persist: {
    ...v190Schema._persist,
    version: 191,
  },
  app: _.omit(v190Schema.app, 'walletConnectV1Enabled'),
}

export const v192Schema = {
  ...v191Schema,
  _persist: {
    ...v191Schema._persist,
    version: 192,
  },
  app: _.omit(v191Schema.app, [
    'showPriceChangeIndicatorInBalances',
    'visualizeNFTsEnabledInHomeAssetsPage',
  ]),
}

export const v193Schema = {
  ...v192Schema,
  _persist: {
    ...v192Schema._persist,
    version: 193,
  },
  keylessBackup: {
    ...v192Schema.keylessBackup,
    deleteBackupStatus: KeylessBackupDeleteStatus.NotStarted,
  },
}

export const v194Schema = {
  ...v193Schema,
  _persist: {
    ...v193Schema._persist,
    version: 194,
  },
  send: {
    ..._.omit(v193Schema.send, 'showSendToAddressWarning'),
    encryptedComment: null,
    isEncryptingComment: false,
  },
}

export const v195Schema = {
  ...v194Schema,
  _persist: {
    ...v194Schema._persist,
    version: 195,
  },
  keylessBackup: {
    ...v194Schema.keylessBackup,
    showDeleteBackupError: false,
  },
}

export const v196Schema = {
  ...v195Schema,
  _persist: {
    ...v195Schema._persist,
    version: 196,
  },
  jumpstart: {
    claimStatus: 'idle',
  },
}

export const v197Schema = {
  ...v196Schema,
  _persist: {
    ...v196Schema._persist,
    version: 197,
  },
  web3: _.omit(v196Schema.web3, 'twelveWordMnemonicEnabled'),
}

export const v198Schema = {
  ...v197Schema,
  _persist: {
    ...v197Schema._persist,
    version: 198,
  },
  home: {
    ...v197Schema.home,
    nftCelebration: null,
  },
}

export const v199Schema = {
  ...v198Schema,
  _persist: {
    ...v198Schema._persist,
    version: 199,
  },
  app: _.omit(v198Schema.app, 'rampCashInButtonExpEnabled'),
}

export const v200Schema = {
  ...v199Schema,
  _persist: {
    ...v199Schema._persist,
    version: 200,
  },
  jumpstart: {
    ...v199Schema.jumpstart,
    depositStatus: 'idle',
  },
}

export const v201Schema = {
  ...v200Schema,
  _persist: {
    ...v200Schema._persist,
    version: 201,
  },
  app: {
    ..._.omit(v200Schema.app, 'hideHomeBalances'),
    hideBalances: false,
  },
}

export const v202Schema = {
  ...v201Schema,
  _persist: {
    ...v201Schema._persist,
    version: 202,
  },
  walletConnect: {
    ...v201Schema.walletConnect,
    pendingSessions: [],
  },
}

export const v203Schema = {
  ...v202Schema,
  _persist: {
    ...v202Schema._persist,
    version: 203,
  },
  jumpstart: {
    ...v202Schema.jumpstart,
    reclaimStatus: 'idle',
  },
}

export const v204Schema = {
  ...v203Schema,
  _persist: {
    ...v203Schema._persist,
    version: 204,
  },
  positions: {
    ...v203Schema.positions,
    positions: mockPositions,
    shortcuts: mockShortcuts,
  },
}

export function getLatestSchema(): Partial<RootState> {
  return v204Schema as Partial<RootState>
}
