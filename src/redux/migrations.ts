import _ from 'lodash'
import { FinclusiveKycStatus, RecoveryPhraseInOnboardingStatus } from 'src/account/reducer'
import { MultichainBetaStatus } from 'src/app/actions'
import { CodeInputStatus } from 'src/components/CodeInput'
import { DEFAULT_SENTRY_NETWORK_ERRORS, DEFAULT_SENTRY_TRACES_SAMPLE_RATE } from 'src/config'
import { Dapp, DappConnectInfo } from 'src/dapps/types'
import { initialState as exchangeInitialState } from 'src/exchange/reducer'
import { CachedQuoteParams, SendingFiatAccountStatus } from 'src/fiatconnect/slice'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { AddressToDisplayNameType } from 'src/identity/reducer'
import { Screens } from 'src/navigator/Screens'
import { Position } from 'src/positions/types'
import { Network, StandbyTransaction, TokenTransaction } from 'src/transactions/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'

export function updateCachedQuoteParams(cachedQuoteParams: {
  [providerId: string]: {
    [kycSchema: string]: any
  }
}) {
  const newCachedQuoteParams: {
    [providerId: string]: {
      [kycSchema: string]: CachedQuoteParams
    }
  } = {}

  Object.entries(cachedQuoteParams).forEach(([providerId, kycSchemas]) => {
    newCachedQuoteParams[providerId] = {}
    Object.entries(kycSchemas).forEach(([kycSchema, cachedParams]) => {
      newCachedQuoteParams[providerId][kycSchema] = {
        ...cachedParams,
        cryptoType:
          cachedParams.cryptoType === Currency.Celo ? CiCoCurrency.CELO : cachedParams.cryptoType,
      }
    })
  })
  return newCachedQuoteParams
}

const DEFAULT_DAILY_PAYMENT_LIMIT_CUSD_LEGACY = 1000

export const migrations = {
  0: (state: any) => {
    const e164NumberToAddressOld = state.identity.e164NumberToAddress
    const e164NumberToAddress: any = {}
    Object.keys(e164NumberToAddressOld).map((e164) => {
      e164NumberToAddress[e164] = [e164NumberToAddressOld[e164]]
    })
    return {
      ...state,
      identity: {
        ...state.identity,
        e164NumberToAddress,
      },
    }
  },
  1: (state: any) => {
    const invitees = Object.entries(state.invite.invitees).map(([address, e164Number]) => ({
      timestamp: Date.now(),
      e164Number,
      tempWalletAddress: address,
      tempWalletPrivateKey: 'fakePrivateKey',
      tempWalletRedeemed: false,
      inviteCode: 'fakeInviteCode',
      inviteLink: 'fakeInviteLink',
    }))

    return {
      ...state,
      invite: {
        ...state.invite,
        invitees,
      },
    }
  },
  2: (state: any) => {
    return {
      ...state,
      app: {
        ...state.app,
        numberVerified: false,
      },
    }
  },
  3: (state: any) => {
    return {
      ...state,
      send: {
        ...state.send,
        recentPayments: [],
      },
      account: {
        ...state.account,
        hasMigratedToNewBip39: false,
      },
    }
  },
  4: (state: any) => {
    return {
      ...state,
      identity: {
        ...state.identity,
        acceptedAttestationCodes: [],
      },
    }
  },
  5: (state: any) => {
    return {
      ...state,
      paymentRequest: {
        incomingPaymentRequests: state.account.incomingPaymentRequests || [],
        outgoingPaymentRequests: state.account.outgoingPaymentRequests || [],
      },
      account: {
        ...state.account,
        incomingPaymentRequests: undefined,
        outgoingPaymentRequests: undefined,
      },
      web3: {
        ...state.web3,
        dataEncryptionKey: state.web3.commentKey,
        commentKey: undefined,
      },
    }
  },
  6: (state: any) => {
    return {
      ...state,
      invite: {
        ...state.invite,
        redeemComplete: !!state.web3.account,
      },
    }
  },
  7: (state: any) => {
    const newAddressToDisplayName = Object.keys(state.identity.addressToDisplayName || {}).reduce(
      (newMapping: AddressToDisplayNameType, address: string) => {
        newMapping[address] = {
          name: state.identity.addressToDisplayName[address],
          imageUrl: null,
        }
        return newMapping
      },
      {}
    )
    return {
      ...state,
      identity: {
        ...state.identity,
        addressToDisplayName: newAddressToDisplayName,
      },
    }
  },
  8: (state: any) => {
    const lastUsedProvider = state.fiatExchanges?.lastUsedProvider
    if (!lastUsedProvider || !lastUsedProvider.name) {
      return state
    }

    const providerDisplayInfo = {
      Moonpay: {
        name: 'Moonpay',
        icon: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
      },
      Ramp: {
        name: 'Ramp',
        icon: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
      },
      Simplex: {
        name: 'Simplex',
        icon: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
      },
      Transak: {
        name: 'Transak',
        icon: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
      },
      Xanpool: {
        name: 'Xanpool',
        icon: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fxanpool.png?alt=media',
      },
    }

    const lastProvider = Object.entries(providerDisplayInfo).find(
      ([, providerInfo]) => providerInfo.name.toLowerCase() === lastUsedProvider.name.toLowerCase()
    )
    return {
      ...state,
      fiatExchanges: {
        ...state.fiatExchanges,
        lastUsedProvider: lastProvider?.[0] ?? null,
      },
    }
  },
  9: (state: any) => {
    if (state.account.dailyLimitCusd >= DEFAULT_DAILY_PAYMENT_LIMIT_CUSD_LEGACY) {
      return state
    }

    return {
      ...state,
      account: {
        ...state.account,
        dailyLimitCusd: DEFAULT_DAILY_PAYMENT_LIMIT_CUSD_LEGACY,
      },
    }
  },
  10: (state: any) => {
    return {
      ...state,
      identity: _.omit(
        state.identity,
        'feelessAttestationCodes',
        'feelessProcessingInputCode',
        'feelessAcceptedAttestationCodes',
        'feelessNumCompleteAttestations',
        'feelessVerificationStatus',
        'verificationState',
        'feelessVerificationState',
        'feelessLastRevealAttempt'
      ),
    }
  },
  11: (state: any) => {
    return {
      ...state,
      app: _.omit(state.app, 'pontoEnabled', 'kotaniEnabled', 'bitfyUrl', 'flowBtcUrl'),
    }
  },
  12: (state: any) => {
    // Removing the exchange rate history because it's very likely that it's repeated a bunch of times.
    return {
      ...state,
      exchange: {
        ...state.exchange,
        history: { ...exchangeInitialState.history },
      },
    }
  },
  13: (state: any) => {
    return {
      ...state,
      identity: {
        ..._.omit(
          state.identity,
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
          state.verify,
          'TEMPORARY_override_withoutVerification',
          'withoutRevealing',
          'retries'
        ),
        seenVerificationNux: state.identity.hasSeenVerificationNux ?? false,
      },
    }
  },
  14: (state: any) => ({
    ...state,
    networkInfo: {
      ...state.networkInfo,
      userLocationData: {
        countryCodeAlpha2: null,
        region: null,
        ipAddress: null,
      },
    },
  }),
  15: (state: any) => {
    return {
      ...state,
      identity: {
        ...state.identity,
        attestationsCode: [],
        acceptedAttestationCodes: [],
        attestationInputStatus: [
          CodeInputStatus.Inputting,
          CodeInputStatus.Disabled,
          CodeInputStatus.Disabled,
        ],
        numCompleteAttestations: 0,
        verificationStatus: 0,
        hasSeenVerificationNux: state.verify.seenVerificationNux,
        lastRevealAttempt: null,
      },
      verify: {
        ..._.omit(
          state.verify,
          'seenVerificationNux',
          'revealStatuses',
          'attestationCodes',
          'lastRevealAttempt',
          'acceptedAttestationCodes',
          'attestationInputStatus'
        ),
        TEMPORARY_override_withoutVerification: undefined,
        withoutRevealing: false,
        retries: 0,
      },
    }
  },
  16: (state: any) => ({
    ...state,
    localCurrency: {
      ...state.localCurrency,
      exchangeRate: undefined,
      exchangeRates: {
        [Currency.Dollar]: state.localCurrency.exchangeRate,
        [Currency.Euro]: null,
        [Currency.Celo]: null,
      },
    },
    stableToken: {
      ...state.stableToken,
      balance: undefined,
      balances: {
        [Currency.Dollar]: state.stableToken.balance,
        [Currency.Euro]: null,
      },
    },
    escrow: {
      isReclaiming: false,
      sentEscrowedPayments: [],
    },
  }),
  17: (state: any) => ({
    ...state,
    fiatExchanges: _.omit(state.fiatExchanges, 'lastUsedProvider'),
  }),
  18: (state: any) => ({
    ...state,
    walletConnect: {
      v2: _.omit(state.walletConnect, 'pairings'),
    },
  }),
  19: (state: any) => {
    // Fixes migration 18 when state.walletConnect is undefined and results
    // in state.walletConnect.v2 to be an empty object and hence not using the reducer initial state
    // See https://github.com/valora-inc/wallet/issues/1270
    if (state.walletConnect?.v2?.sessions === undefined) {
      return {
        ...state,
        walletConnect: {
          ...state.walletConnect,
          v2: undefined,
        },
      }
    }
    return state
  },
  20: (state: any) => state,
  21: (state: any) => state,
  22: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      language: undefined,
    },
    i18n: {
      language: state.app.language,
      allowOtaTranslations: false,
      otaTranslationsLastUpdate: 0,
      otaTranslationsAppVersion: '0',
      otaTranslationsLanguage: '',
    },
  }),
  23: (state: any) => state,
  24: (state: any) => ({
    ...state,
    invite: undefined,
  }),
  25: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      sentryTracesSampleRate: DEFAULT_SENTRY_TRACES_SAMPLE_RATE,
    },
  }),
  26: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      rampCashInButtonExpEnabled: false,
    },
  }),
  27: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      superchargeButtonType: 'PILL_REWARDS',
    },
  }),
  28: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      dappListApiUrl: null,
    },
  }),
  29: (state: any) => ({
    ...state,
    web3: {
      ...state.web3,
      // Move everybody to forno, i.e. disables the light client
      fornoMode: true,
      hadFornoDisabled: state.web3.fornoMode === false,
    },
  }),
  30: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      sentryNetworkErrors: DEFAULT_SENTRY_NETWORK_ERRORS,
    },
  }),
  31: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      biometryEnabled: false,
      supportedBiometryType: null,
    },
    account: {
      ...state.account,
      isSettingPin: undefined,
    },
  }),
  32: (state: any) => ({
    ...state,
    account: {
      ...state.account,
      hasLinkedBankAccount: false,
    },
  }),
  33: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      ranVerificationMigrationAt: null,
    },
  }),
  34: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      superchargeApy: REMOTE_CONFIG_VALUES_DEFAULTS.superchargeApy,
      superchargeTokens: [],
      rewardsPercent: undefined,
      rewardsStartDate: undefined,
      rewardsMax: undefined,
      rewardsMin: undefined,
      rewardsABTestThreshold: undefined,
    },
  }),
  35: (state: any) => state,
  36: (state: any) => ({
    ...state,
    account: {
      ...state.account,
      finclusiveKycStatus: FinclusiveKycStatus.NotSubmitted,
    },
    app: {
      ...state.app,
      maxNumRecentDapps: 0,
      recentDapps: [],
    },
  }),
  37: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      showPriceChangeIndicatorInBalances:
        REMOTE_CONFIG_VALUES_DEFAULTS.showPriceChangeIndicatorInBalances,
    },
  }),
  38: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      skipVerification: false,
    },
  }),
  39: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      paymentDeepLinkHandler: '',
    },
  }),
  40: (state: any) => {
    return {
      ...(_.omit(state, ['medianator', 'invite']) as any),
      account: {
        ..._.omit(state.account, [
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
      app: {
        ..._.omit(state.app, [
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
      },
      escrow: {
        ..._.omit(state.escrow, ['suggestedFee']),
      },
      exchange: {
        ..._.omit(state.exchange, ['exchangeRatePair']),
        history: {
          ..._.omit(state.exchange.history, ['isLoading']),
        },
      },
      home: {
        ...state.home,
        ...(Array.isArray(state.home.notifications) ? { notifications: {} } : undefined),
      },
      identity: {
        ..._.omit(state.identity, [
          'verificationFailed',
          'startedVerification',
          'isLoadingImportContacts',
          'contactMappingProgress',
          'attestationsCode',
        ]),
      },
      localCurrency: {
        ..._.omit(state.localCurrency, ['exchangeRate', 'fetchRateFailed']),
      },
      recipients: {
        ..._.omit(state.recipients, ['recipientCache']),
      },
      send: {
        ..._.omit(state.send, ['recipientCache']),
      },
      stableToken: {
        ..._.omit(state.stableToken, ['balance']),
      },
      tokens: {
        ..._.omit(state.tokens, ['lastSuccessfulFetch']),
      },
      walletConnect: {
        ...(state.walletConnect?.v2?.sessions === undefined
          ? _.omit(state.walletConnect, 'v2')
          : state.walletConnect),
      },
      web3: {
        ..._.omit(state.web3, ['commentKey', 'gasPriceLastUpdated', 'contractKitReady']),
      },
    }
  },
  41: (state: any) => state,
  42: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      skipProfilePicture: false,
    },
  }),
  43: (state: any) => state,
  44: (state: any) => ({
    ...state,
    account: {
      ...state.account,
      finclusiveRegionSupported: false,
    },
    app: {
      ...state.app,
      finclusiveUnsupportedStates: ['NY', 'TX'],
    },
  }),
  45: (state: any) => state,
  46: (state: any) => ({
    ...state,
    cloudFunctionsApi: undefined,
  }),
  47: (state: any) => {
    return {
      ...state,
      app: _.omit(
        state.app,
        'multiTokenUseSendFlow',
        'multiTokenUseUpdatedFeed',
        'multiTokenShowHomeBalances'
      ),
    }
  },
  48: (state: any) => {
    return {
      ...(_.omit(state, ['cloudFunctionsApi']) as any),
      supercharge: {
        ...state.supercharge,
        fetchAvailableRewardsLoading: false,
        fetchAvailableRewardsError: false,
        availableRewards: [],
      },
    }
  },
  49: (state: any) => {
    return {
      ...state,
      account: {
        ...state.account,
        dismissedKeepSupercharging: false,
        dismissedStartSupercharging: false,
      },
    }
  },
  50: (state: any) => ({
    ...state,
    walletConnect: {
      ..._.omit(state.walletConnect, ['v2']),
    },
  }),
  51: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      celoWithdrawalEnabledInExchange: true,
    },
  }),
  52: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      fiatConnectCashInEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.fiatConnectCashInEnabled,
      fiatConnectCashOutEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.fiatConnectCashOutEnabled,
    },
  }),
  53: (state: any) => ({
    ...(_.omit(state, 'geth') as any),
    account: _.omit(state.account, 'promptFornoIfNeeded', 'retryVerificationWithForno'),
    web3: _.omit(state.web3, 'syncProgress', 'latestBlockNumber', 'fornoMode', 'hadFornoDisabled'),
  }),
  54: (state: any) => ({
    ...state,
    dapps: {
      dappsWebViewEnabled: state.app.dappsWebViewEnabled ?? false,
      activeDapp: state.app.activeDapp ?? null,
      maxNumRecentDapps: state.app.maxNumRecentDapps,
      recentDapps: state.app.recentDapps,
      dappListApiUrl: state.app.dappListApiUrl,
    },
    app: _.omit(
      state.app,
      'dappsWebViewEnabled',
      'maxNumRecentDapps',
      'recentDapps',
      'dappListApiUrl',
      'activeDapp'
    ),
  }),
  55: (state: any) => ({
    ...state,
    dapps: {
      ...state.dapps,
      dappsList: [],
      dappsListLoading: false,
      dappsListError: null,
      dappsCategories: [],
    },
  }),
  56: (state: any) => ({
    ...state,
    dapps: {
      ...state.dapps,
      dappConnectInfo: DappConnectInfo.Default,
    },
  }),
  57: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      visualizeNFTsEnabledInHomeAssetsPage:
        REMOTE_CONFIG_VALUES_DEFAULTS.visualizeNFTsEnabledInHomeAssetsPage,
    },
  }),
  58: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      coinbasePayEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.coinbasePayEnabled,
    },
  }),
  59: (state: any) => ({
    ...state,
    transactions: {
      ...state.transactions,
      transactions: (state.transactions.transactions || []).filter(
        (transaction: TokenTransaction) => Object.keys(transaction).length > 0
      ),
    },
  }),
  60: (state: any) => ({
    ...state,
    fiatConnect: {
      quotes: [],
      quotesLoading: false,
      quotesError: null,
    },
  }),
  61: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      showSwapMenuInDrawerMenu: REMOTE_CONFIG_VALUES_DEFAULTS.showSwapMenuInDrawerMenu,
    },
  }),
  62: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      transfer: null,
    },
  }),
  63: (state: any) => ({
    ...state,
    app: {
      ..._.omit(state.app, 'superchargeTokens'),
      superchargeTokenConfigByToken: {},
    },
  }),
  64: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      providers: null,
    },
  }),
  65: (state: any) => state,
  66: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      cachedFiatAccountUses: [],
      attemptReturnUserFlowLoading: false,
    },
  }),
  67: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      selectFiatConnectQuoteLoading: false,
    },
  }),
  68: (state: any) => ({
    ...state,
    app: _.omit(
      state.app,
      'linkBankAccountEnabled',
      'linkBankAccountStepTwoEnabled',
      'finclusiveUnsupportedStates'
    ),
    account: _.omit(
      state.account,
      'hasLinkedBankAccount',
      'finclusiveRegionSupported',
      'finclusiveKycStatus',
      'kycStatus'
    ),
  }),
  69: (state: any) => ({
    ...state,
    recipients: {
      ...state.recipients,
      coinbasePaySenders: [],
    },
  }),
  70: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      createAccountCopyTestType: 'ACCOUNT',
    },
  }),
  71: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      maxSwapSlippagePercentage: REMOTE_CONFIG_VALUES_DEFAULTS.maxSwapSlippagePercentage,
      swapFeeEnabled: false,
      swapFeePercentage: false,
    },
  }),
  72: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      shouldShowRecoveryPhraseInSettings: false,
    },
  }),
  73: (state: any) => state,
  74: (state: any) => ({
    ...state,
    identity: _.omit(state.identity, 'matchedContacts'),
  }),
  75: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'showRaiseDailyLimitTarget'),
    account: _.omit(state.account, 'dailyLimitRequestStatus', 'dailyLimitCusd'),
  }),
  76: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      showGuidedOnboardingCopy: false,
    },
  }),
  77: (state: any) => state,
  78: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      sendingFiatAccount: false,
    },
  }),
  79: (state: any) => ({
    ...state,
    fiatConnect: {
      ..._.omit(state.fiatConnect, 'sendingFiatAccount'),
      sendingFiatAccountStatus: SendingFiatAccountStatus.NotSending,
    },
  }),
  80: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      kycTryAgainLoading: false,
    },
  }),
  81: (state: any) => state,
  82: (state: any) => ({
    ...state,
    swap: {
      swapState: 'quote',
      swapInfo: null,
      swapUserInput: null,
    },
  }),
  83: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      cachedQuoteParams: {},
    },
  }),
  84: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      schemaCountryOverrides: {},
    },
  }),
  85: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'swapFeeEnabled', 'swapFeePercentage'),
  }),
  86: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      cachedFiatAccountUses: [],
    },
  }),
  87: (state: any) => state,
  88: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      networkTimeoutSeconds: REMOTE_CONFIG_VALUES_DEFAULTS.networkTimeoutSeconds,
    },
  }),
  89: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'superchargeButtonType'),
  }),
  90: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'biometryEnabled'),
  }),
  91: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      personaInProgress: false,
    },
  }),
  92: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'celoWithdrawalEnabledInExchange'),
  }),
  93: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      transfer: null,
    },
  }),
  94: (state: any) => ({
    ...state,
    walletConnect: {
      ...state.walletConnect,
      v2: {
        sessions: [],
        pendingSessions: [],
        pendingActions: [],
      },
    },
    app: {
      ...state.app,
      walletConnectV2Enabled: true,
    },
  }),
  95: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      providers: null,
    },
  }),
  96: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'paymentDeepLinkHandler'),
  }),
  97: (state: any) => ({
    ...state,
    dapps: {
      ...state.dapps,
      dappFavoritesEnabled: false,
      favoriteDapps: [],
    },
  }),
  98: (state: any) => state,
  99: (state: any) => ({
    ...state,
    dapps: {
      ..._.omit(state.dapps, 'recentDapps', 'favoriteDapps'),
      recentDappIds: state.dapps.recentDapps.map((dapp: Dapp) => dapp.id),
      favoriteDappIds: state.dapps.favoriteDapps.map((dapp: Dapp) => dapp.id),
    },
  }),
  100: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'celoNewsEnabled'),
  }),
  101: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'inviteMethod', 'inviteModalVisible'),
  }),
  102: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'centralPhoneVerificationEnabled', 'hideVerification'),
  }),
  103: (state: any) => ({
    ..._.omit(state, 'verify'),
    _persist: state._persist,
    identity: _.omit(
      state.identity,
      'attestationCodes',
      'acceptedAttestationCodes',
      'attestationInputStatus',
      'numCompleteAttestations',
      'verificationStatus',
      'lastRevealAttempt'
    ),
    app: _.omit(
      state.app,
      'komenciAllowedDeployers',
      'komenciUseLightProxy',
      'ranVerificationMigrationAt'
    ),
  }),
  104: (state: any) => ({
    ...(_.omit(state, ['goldToken', 'stableToken']) as any),
    account: {
      ...state.account,
      celoEducationCompleted: state.goldToken.educationCompleted,
    },
  }),
  105: (state: any) => ({
    ...state,
    web3: {
      ...state.web3,
      twelveWordMnemonicEnabled: false,
    },
  }),
  106: (state: any) => state,
  107: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      cachedFiatAccountUses: state.fiatConnect.cachedFiatAccountUses.map(
        (use: { cryptoType: Currency }) => ({
          ...use,
          cryptoType: use.cryptoType === Currency.Celo ? CiCoCurrency.CELO : use.cryptoType,
        })
      ),
      cachedQuoteParams: updateCachedQuoteParams(state.fiatConnect.cachedQuoteParams),
    },
  }),
  108: (state: any) => ({
    ...state,
    fiatConnect: {
      ...state.fiatConnect,
      cachedTransfers: {},
    },
  }),
  109: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      paymentDeepLinkHandler: '',
    },
  }),
  110: (state: any) => ({
    ...state,
    swap: {
      ...state.swap,
      guaranteedSwapPriceEnabled: REMOTE_CONFIG_VALUES_DEFAULTS.guaranteedSwapPriceEnabled,
    },
  }),
  111: (state: any) => state,
  112: (state: any) => ({
    ...state,
    dapps: {
      ...state.dapps,
      dappsFilterEnabled: false,
      dappsSearchEnabled: false,
    },
  }),
  113: (state: any) => ({
    ...state,
    app: _.omit(
      state.app,
      'skipProfilePicture',
      'showGuidedOnboardingCopy',
      'createAccountCopyTestType'
    ),
  }),
  114: (state: any) => state,
  115: (state: any) => ({
    ...state,
    account: {
      ...state.account,
      dismissedGetVerified:
        state.app.numberVerified && !state.app.phoneNumberVerified
          ? false
          : state.account.dismissedGetVerified,
    },
    app: {
      ...state.app,
      requireCPV: false,
    },
  }),
  116: (state: any) => ({
    ...state,
    account: {
      ...state.account,
      startOnboardingTime: undefined,
    },
  }),
  117: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'cashInButtonExpEnabled'),
  }),
  118: (state: any) => ({
    ...state,
    send: {
      ..._.omit(state.send, 'inviteRewardsEnabled'),
      inviteRewardsVersion: 'none',
    },
  }),
  119: (state: any) => state,
  120: (state: any) => state,
  121: (state: any) => state,
  122: (state: any) => ({
    ...state,
    account: {
      ...state.account,
      recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus.NotStarted,
    },
  }),
  123: (state: any) => ({
    ...state,
    dapps: _.omit(state.dapps, 'dappsFilterEnabled', 'dappsSearchEnabled'),
  }),
  124: (state: any) => state,
  125: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      celoNews: _.omit(state.app.celoNews, 'enabled'),
    },
  }),
  126: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      inAppReviewLastInteractionTimestamp: null,
    },
  }),
  127: (state: any) => state,
  128: (state: any) => ({
    ...state,
    positions: {
      ...state.positions,
      positions: [],
    },
  }),
  129: (state: any) => state,
  130: (state: any) => state,
  131: (state: any) => ({
    ...state,
    dapps: {
      ...state.dapps,
      dappsList: state.dapps.dappsList.map(
        (dapp: Dapp | (Omit<Dapp, 'categories'> & { categoryId: string })) => ({
          ...dapp,
          categories: 'categories' in dapp ? dapp.categories : [dapp.categoryId],
        })
      ),
      activeDapp: state.dapps.activeDapp
        ? {
            ...state.dapps.activeDapp,
            categories: state.dapps.activeDapp.categories ?? [state.dapps.activeDapp.categoryId],
          }
        : null,
    },
  }),
  132: (state: any) => ({
    ...state,
    positions: {
      ...state.positions,
      positions: state.positions.positions.map((position: Position) => ({
        ...position,
        availableShortcutIds: [],
      })),
      shortcuts: [],
      shortcutsStatus: 'idle',
    },
  }),
  133: (state: any) => ({
    ...state,
    nfts: {
      nfts: [],
      nftsLoading: false,
      nftsError: null,
    },
  }),
  134: (state: any) => ({
    ...state,
    positions: {
      ...state.positions,
      previewApiUrl: null,
    },
  }),
  135: (state: any) => state,
  136: (state: any) => ({
    ...state,
    account: _.omit(state.account, 'backupRequiredTime'),
  }),
  137: (state: any) => ({
    ...state,
    walletConnect: {
      ..._.omit(state.walletConnect, 'v1', 'v2'),
      sessions: state.walletConnect.v2.sessions,
      pendingActions: state.walletConnect.v2.pendingActions,
      pendingSessions: state.walletConnect.v2.pendingSessions,
    },
  }),
  138: (state: any) => state,
  139: (state: any) => state,
  140: (state: any) => state,
  141: (state: any) => state,
  142: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'shouldShowRecoveryPhraseInSettings'),
  }),
  143: (state: any) => ({
    ...state,
    account: {
      ...state.account,
      cloudBackupCompleted: false,
    },
  }),
  144: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      // set this to a non null value for existing users so that they do not get
      // prompted for push notification permissions again
      pushNotificationRequestedUnixTime: 1692878055000,
    },
  }),
  145: (state: any) => ({
    ...state,
    transactions: {
      ...state.transactions,
      standbyTransactions: (state.transactions.standbyTransactions as StandbyTransaction[]).map(
        (tx) => {
          return { ...tx, network: Network.Celo }
        }
      ),
      transactions: (state.transactions.transactions as TokenTransaction[]).map((tx) => {
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
  }),
  146: (state: any) => ({
    ...state,
    localCurrency: {
      ..._.omit(state.localCurrency, 'exchangeRates'),
      // We were previously fetching cUSD to local, but blockchain-api was returning USD to local
      // assuming cUSD == USD, so it's correct to keep this rate here
      usdToLocalRate: state.localCurrency.exchangeRates[Currency.Dollar],
    },
  }),
  147: (state: any) => ({
    ...state,
    transactions: {
      ...state.transactions,
      standbyTransactions: (
        state.transactions.standbyTransactions as (StandbyTransaction & { network: Network })[]
      ).map((tx) => {
        return {
          ..._.omit(tx, 'network'),
          networkId: networkConfig.networkToNetworkId[tx.network],
        }
      }),
      transactions: (
        state.transactions.transactions as (TokenTransaction & { network: Network })[]
      ).map((tx) => {
        return {
          ..._.omit(tx, 'network'),
          networkId: networkConfig.networkToNetworkId[tx.network],
        }
      }),
    },
  }),
  148: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      showNotificationSpotlight: true, // true for all upgrading users
    },
  }),
  149: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      activeScreen: Object.values(Screens).includes(state.app.activeScreen)
        ? state.app.activeScreen
        : 'Main', // same as initial state. should be very rare, since removed screens were not present in prev app version.
    },
  }),
  150: (state: any) => ({
    ...state,
    tokens: {
      ...state.tokens,
      tokenBalances: {},
    },
  }),
  151: (state: any) => ({
    ...state,
    tokens: {
      ...state.tokens,
      tokenBalances: {},
    },
  }),
  152: (state: any) => state,
  153: (state: any) => ({
    ...state,
    exchange: _.omit(state.exchange, 'isLoading'),
  }),
  154: (state: any) => ({
    ...state,
    exchange: {
      ..._.omit(state.exchange, 'exchangeRates', 'tobinTax'),
    },
  }),
  155: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'paymentDeepLinkHandler'),
  }),
  156: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'requireCPV'),
  }),
  157: (state: any) => ({
    ...state,
    transactions: {
      ...state.transactions,
      standbyTransactions: [],
      transactions: [],
    },
  }),
  158: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'decentralizedVerificationEnabled'),
  }),
  159: (state: any) => ({
    ...state,
    transactions: _.omit(state.transactions, 'standbyTransactionsLegacy'),
  }),
  160: (state: any) => {
    const output = {
      ...state,
      app: {
        ...state.app,
        activeScreen: Object.values(Screens).includes(state.app.activeScreen)
          ? state.app.activeScreen
          : 'Main', // since PaymentRequestConfirmation screen was deleted
      },
    }
    delete output.paymentRequest // doing this instead of output = {..._.omit(state, 'paymentRequest')} because _.omit removes underscore-prefixed properties too, like the required _persist key
    return output
  },
  161: (state: any) => ({
    ...state,
    transactions: {
      ...state.transactions,
      standbyTransactions: state.transactions.standbyTransactions.map((tx: any) => {
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
      transactions: state.transactions.transactions.map((tx: any) => {
        return {
          ...tx,
          status: 'Complete',
        }
      }),
    },
  }),
  162: (state: any) => ({
    ...state,
    transactions: {
      ...state.transactions,
      standbyTransactions: state.transactions.standbyTransactions.filter((tx: any) => {
        // this migration requires extra data on completed standby transactions
        // that we cannot recover, so we remove these from the store. this is
        // low risk since completed tx's will be returned by blockchain-api
        // eventually.
        return tx.status !== 'Complete'
      }),
    },
  }),
  163: (state: any) => ({
    ...state,
    send: { ..._.omit(state.send, 'lastUsedCurrency'), lastUsedTokenId: undefined },
  }),
  164: (state: any) => ({
    ...state,
    app: _.omit(state.app, 'rampCashInButtonExpEnabled'),
  }),
  165: (state: any) => {
    const transactionsByNetworkId: any = {}
    for (const tx of state.transactions.transactions) {
      const txNetworkId = tx.networkId ?? networkConfig.defaultNetworkId
      transactionsByNetworkId[txNetworkId] = [...(transactionsByNetworkId[txNetworkId] ?? []), tx]
    }

    return {
      ...state,
      transactions: {
        ..._.omit(state.transactions, 'transactions'),
        transactionsByNetworkId,
      },
    }
  },
  166: (state: any) => ({ ...state, app: { ...state.app, hideHomeBalances: false } }),
  167: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      rampCashInButtonExpEnabled: false,
    },
  }),
  168: (state: any) => ({
    ...state,
    swap: _.omit(state.swap, 'swapUserInput'),
  }),
  169: (state: any) => state,
  170: (state: any) => ({
    ...state,
    supercharge: _.omit(state.supercharge, 'superchargeV2Enabled', 'superchargeV1Addresses'),
  }),
  171: (state: any) => ({
    ...state,
    app: {
      ...state.app,
      multichainBetaStatus: MultichainBetaStatus.NotSeen,
    },
  }),
  172: (state: any) => ({
    ...state,
    swap: {
      ..._.omit(state.swap, 'swapInfo'),
      currentSwap: null,
    },
  }),
  173: (state: any) => ({
    ...state,
    swap: _.omit(state.swap, 'swapState'),
  }),
  174: (state: any) => ({
    ...state,
    identity: {
      ...state.identity,
      addressToVerificationStatus: {},
    },
  }),
}
