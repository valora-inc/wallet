import _ from 'lodash'
import { CodeInputStatus } from 'src/components/CodeInput'
import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { initialState as exchangeInitialState } from 'src/exchange/reducer'
import { AddressToDisplayNameType } from 'src/identity/reducer'
import { VerificationStatus } from 'src/identity/types'
import { Currency } from 'src/utils/currencies'

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
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
      },
      Ramp: {
        name: 'Ramp',
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
      },
      Simplex: {
        name: 'Simplex',
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
      },
      Transak: {
        name: 'Transak',
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
      },
      Xanpool: {
        name: 'Xanpool',
        icon:
          'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fxanpool.png?alt=media',
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
    if (state.account.dailyLimitCusd >= DEFAULT_DAILY_PAYMENT_LIMIT_CUSD) {
      return state
    }

    return {
      ...state,
      account: {
        ...state.account,
        dailyLimitCusd: DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
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
        verificationStatus: VerificationStatus.Stopped,
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
  24: (state: any) => state,
}
