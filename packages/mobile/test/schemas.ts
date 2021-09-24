import _ from 'lodash'
import { PincodeType } from 'src/account/reducer'
import { AppState } from 'src/app/actions'
import { CodeInputStatus } from 'src/components/CodeInput'
import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'
import { idle, KomenciAvailable } from 'src/verify/reducer'

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
    preferredCurrencyCode: 'MXN',
    fetchedCurrencyCode: 'MXN',
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
    dismissedEarnRewards: false,
    dismissedInviteFriends: false,
    promptFornoIfNeeded: false,
    acceptedTerms: false,
  },
  invite: {
    isSendingInvite: false,
    isRedeemingInvite: false,
    isSkippingInvite: false,
    invitees: [],
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
    preferredCurrencyCode: 'MXN',
    fetchedCurrencyCode: 'MXN',
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
  walletConnect: {
    v1: {
      pendingActions: [],
      sessions: [],
      pendingSessions: [],
    },
    v2: _.omit(v17Schema.walletConnect, 'pairings'),
  },
}

export function getLatestSchema(): Partial<RootState> {
  return v18Schema as Partial<RootState>
}
