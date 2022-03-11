import Ajv from 'ajv'
import * as createMigrateModule from 'src/redux/createMigrate'
import { migrations } from 'src/redux/migrations'
import { setupStore, _persistConfig } from 'src/redux/store'
import * as accountCheckerModule from 'src/utils/accountChecker'
import { getLatestSchema, vNeg1Schema } from 'test/schemas'

// Mock sagas because we don't want them to run in this test
jest.mock('src/redux/sagas', () => ({
  rootSaga: jest.fn(function* () {}),
}))
jest.unmock('redux-persist')

const originalCreateMigrate = jest.requireActual('src/redux/createMigrate').createMigrate

const createMigrate = jest.spyOn(createMigrateModule, 'createMigrate')
const resetStateOnInvalidStoredAccount = jest.spyOn(
  accountCheckerModule,
  'resetStateOnInvalidStoredAccount'
)

beforeEach(() => {
  jest.clearAllMocks()
  // For some reason createMigrate.mockRestore doesn't work, so instead we manually reset it to the original implementation
  createMigrate.mockImplementation(originalCreateMigrate)
  resetStateOnInvalidStoredAccount.mockImplementation((state) => Promise.resolve(state))
})

describe('persistConfig', () => {
  it('points to the latest migration', () => {
    const migrationKeys = Object.keys(migrations)
      .map((ver) => parseInt(ver, 10))
      .sort((a, b) => a - b)

    // If this test fails, a migration has been added without increasing the persistConfig version
    expect(_persistConfig.version).toEqual(migrationKeys[migrationKeys.length - 1])
  })

  it('is in sync with the test schema', () => {
    // This is a good practice, we want to keep the test schema in sync with the migrations
    // so we can more easily test them
    expect(_persistConfig.version).toEqual(getLatestSchema()._persist?.version)
  })

  it('migrate calls the expected methods', async () => {
    createMigrate.mockReturnValue(() => Promise.resolve({ migrated: true }) as any)
    const state = await _persistConfig.migrate!({} as any, -1)
    expect(state).toEqual({ migrated: true })
    expect(createMigrate).toHaveBeenCalledTimes(1)
    expect(resetStateOnInvalidStoredAccount).toHaveBeenCalledTimes(1)
  })
})

describe('store state', () => {
  // This test ensures the vNeg1Schema can be successfully migrated to the latest version
  // and validates against the latest RootState schema
  it('validates against the RootState schema after rehydration', async () => {
    const { store, persistor } = setupStore(undefined, {
      ..._persistConfig,
      // @ts-ignore
      getStoredState: async () => {
        // Remove undefined values from the test state
        return JSON.parse(JSON.stringify(vNeg1Schema))
      },
    })

    // Wait for the persistor to have rehydrated the state
    await new Promise((resolve) => {
      persistor.subscribe(() => {
        const { bootstrapped } = persistor.getState()
        if (bootstrapped) {
          resolve(true)
        }
      })
    })

    const data = store.getState()
    const ajv = new Ajv({ allErrors: true })
    const schema = require('test/RootStateSchema.json')
    const validate = ajv.compile(schema)
    const isValid = validate(data)

    expect(validate.errors).toBeNull()
    expect(isValid).toBe(true)

    // Make sure the state looks the way we expect it to.
    // This should help catch unintentional changes to the state, caused by incorrect migrations
    expect(data).toMatchInlineSnapshot(`
      Object {
        "_persist": Object {
          "rehydrated": true,
          "version": 39,
        },
        "account": Object {
          "acceptedTerms": false,
          "accountCreationTime": 99999999999999,
          "accountToRecoverFromStoreWipe": undefined,
          "backupCompleted": false,
          "backupDelayedTime": 0,
          "backupRequiredTime": null,
          "choseToRestoreAccount": false,
          "contactDetails": Object {
            "contactId": "contactId",
            "thumbnailPath": null,
          },
          "dailyLimitCusd": 1000,
          "dailyLimitRequestStatus": undefined,
          "defaultCountryCode": "+1",
          "devModeActive": false,
          "devModeClickCount": 0,
          "dismissedGetVerified": false,
          "dismissedGoldEducation": false,
          "dismissedInviteFriends": false,
          "e164PhoneNumber": "+14155556666",
          "finclusiveKycStatus": 0,
          "hasLinkedBankAccount": false,
          "hasMigratedToNewBip39": false,
          "incomingPaymentRequests": undefined,
          "isSettingPin": undefined,
          "kycStatus": undefined,
          "name": "John Doe",
          "outgoingPaymentRequests": undefined,
          "photosNUXClicked": false,
          "pictureUri": null,
          "pincodeSet": false,
          "pincodeType": "Unset",
          "profileUploaded": false,
          "promptFornoIfNeeded": false,
          "recoveringFromStoreWipe": false,
          "retryVerificationWithForno": true,
          "socialBackupCompleted": false,
        },
        "alert": null,
        "app": Object {
          "activeScreen": "Main",
          "analyticsEnabled": true,
          "appState": "Active",
          "biometryEnabled": false,
          "cashInButtonExpEnabled": false,
          "celoEducationUri": null,
          "celoEuroEnabled": true,
          "dappListApiUrl": null,
          "dismissErrorAfter": null,
          "dismissMessageAfter": null,
          "doingBackupFlow": false,
          "error": null,
          "googleMobileServicesAvailable": undefined,
          "hideVerification": false,
          "huaweiMobileServicesAvailable": undefined,
          "inviteCodeEntered": false,
          "inviteModalVisible": false,
          "language": undefined,
          "lastTimeBackgrounded": 0,
          "linkBankAccountEnabled": false,
          "linkBankAccountStepTwoEnabled": false,
          "loading": false,
          "lockWithPinEnabled": false,
          "locked": false,
          "logPhoneNumberTypeEnabled": false,
          "loggedIn": false,
          "maxNumRecentDapps": 0,
          "message": null,
          "minVersion": null,
          "multiTokenShowHomeBalances": true,
          "multiTokenUseSendFlow": false,
          "multiTokenUseUpdatedFeed": false,
          "numberVerified": false,
          "pincodeUseExpandedBlocklist": false,
          "rampCashInButtonExpEnabled": false,
          "ranVerificationMigrationAt": null,
          "recentDapps": Array [],
          "requirePinOnAppOpen": false,
          "rewardPillText": Object {
            "de": "Belohnungen",
            "en": "Rewards",
            "es": "Recompensas",
            "pt": "Recompensas",
          },
          "rewardsABTestThreshold": undefined,
          "rewardsMax": undefined,
          "rewardsMin": undefined,
          "rewardsPercent": undefined,
          "rewardsStartDate": undefined,
          "sentryNetworkErrors": Array [
            "network request failed",
          ],
          "sentryTracesSampleRate": 0.2,
          "sessionId": "",
          "showPriceChangeIndicatorInBalances": false,
          "showRaiseDailyLimitTarget": undefined,
          "skipVerification": false,
          "superchargeApy": 25,
          "superchargeButtonType": "PILL_REWARDS",
          "superchargeTokens": Array [],
          "supportedBiometryType": null,
          "walletConnectV1Enabled": true,
          "walletConnectV2Enabled": false,
        },
        "cloudFunctionsApi": Object {
          "config": Object {
            "focused": true,
            "keepUnusedDataFor": 60,
            "middlewareRegistered": true,
            "online": true,
            "reducerPath": "cloudFunctionsApi",
            "refetchOnFocus": false,
            "refetchOnMountOrArgChange": false,
            "refetchOnReconnect": false,
          },
          "mutations": Object {},
          "provided": Object {},
          "queries": Object {},
          "subscriptions": Object {},
        },
        "escrow": Object {
          "isReclaiming": false,
          "sentEscrowedPayments": Array [],
        },
        "exchange": Object {
          "exchangeRatePair": undefined,
          "exchangeRates": null,
          "history": Object {
            "aggregatedExchangeRates": Array [],
            "celoGoldExchangeRates": Array [],
            "granularity": 60,
            "lastTimeUpdated": 0,
            "range": 2592000000,
          },
          "isLoading": false,
          "tobinTax": "0",
        },
        "fees": Object {
          "estimates": Object {},
        },
        "fiatExchanges": Object {
          "providerLogos": Object {},
          "txHashToProvider": Object {},
        },
        "geth": Object {
          "chainHead": null,
          "connected": true,
          "gethStartedThisSession": false,
          "initialized": "INITIALIZED",
        },
        "goldToken": Object {
          "balance": null,
          "educationCompleted": false,
          "lastFetch": null,
        },
        "home": Object {
          "loading": false,
          "notifications": Object {},
        },
        "i18n": Object {
          "allowOtaTranslations": false,
          "language": "es-419",
          "otaTranslationsAppVersion": "0",
          "otaTranslationsLanguage": "",
          "otaTranslationsLastUpdate": 0,
        },
        "identity": Object {
          "acceptedAttestationCodes": Array [],
          "addressToDataEncryptionKey": Object {},
          "addressToDisplayName": Object {},
          "addressToE164Number": Object {},
          "askedContactsPermission": false,
          "attestationCodes": Array [],
          "attestationInputStatus": Array [
            "Inputting",
            "Disabled",
            "Disabled",
          ],
          "attestationsCode": Array [],
          "contactMappingProgress": Object {
            "current": 0,
            "total": 0,
          },
          "e164NumberToAddress": Object {},
          "e164NumberToSalt": Object {},
          "hasSeenVerificationNux": false,
          "importContactsProgress": Object {
            "current": 0,
            "status": 0,
            "total": 0,
          },
          "isLoadingImportContacts": false,
          "lastRevealAttempt": null,
          "matchedContacts": Object {},
          "numCompleteAttestations": 0,
          "secureSendPhoneNumberMapping": Object {},
          "startedVerification": false,
          "verificationFailed": false,
          "verificationStatus": 0,
          "walletToAccountAddress": Object {},
        },
        "imports": Object {
          "isImportingWallet": false,
        },
        "invite": undefined,
        "localCurrency": Object {
          "error": false,
          "exchangeRate": undefined,
          "exchangeRates": Object {
            "cEUR": null,
            "cGLD": null,
            "cUSD": "1.33",
          },
          "fetchedCurrencyCode": "PHP",
          "isLoading": false,
          "preferredCurrencyCode": "PHP",
        },
        "medianator": Object {
          "exchangeRate": "1",
        },
        "networkInfo": Object {
          "connected": false,
          "rehydrated": true,
          "userLocationData": Object {
            "countryCodeAlpha2": null,
            "ipAddress": null,
            "region": null,
          },
        },
        "paymentRequest": Object {
          "incomingPaymentRequests": Array [],
          "outgoingPaymentRequests": Array [],
        },
        "recipients": Object {
          "inviteRewardsSenders": Array [],
          "phoneRecipientCache": Object {},
          "recipientCache": Object {},
          "rewardsSenders": Array [],
          "valoraRecipientCache": Object {},
        },
        "send": Object {
          "inviteRewardCusd": 5,
          "inviteRewardWeeklyLimit": 20,
          "inviteRewardsEnabled": false,
          "isSending": false,
          "lastUsedCurrency": "cUSD",
          "recentPayments": Array [],
          "recentRecipients": Array [],
          "recipientCache": Object {},
          "showSendToAddressWarning": true,
        },
        "stableToken": Object {
          "balance": undefined,
          "balances": Object {
            "cEUR": null,
            "cUSD": null,
          },
          "educationCompleted": false,
          "lastFetch": null,
        },
        "supercharge": Object {
          "error": false,
          "loading": false,
        },
        "tokens": Object {
          "error": false,
          "loading": false,
          "tokenBalances": Object {},
        },
        "transactions": Object {
          "knownFeedTransactions": Object {},
          "recentTxRecipientsCache": Object {},
          "standbyTransactions": Array [],
          "standbyTransactionsLegacy": Array [],
          "transactions": Array [],
        },
        "verify": Object {
          "TEMPORARY_override_withoutVerification": undefined,
          "actionableAttestations": Array [],
          "currentState": Object {
            "type": "Idle",
          },
          "komenci": Object {
            "callbackUrl": undefined,
            "captchaToken": "",
            "errorTimestamps": Array [],
            "sessionActive": false,
            "sessionToken": "",
            "unverifiedMtwAddress": null,
          },
          "komenciAvailable": "UNKNOWN",
          "komenciConfig": Object {
            "allowedDeployers": Array [
              "",
            ],
            "useLightProxy": false,
          },
          "retries": 0,
          "status": Object {
            "completed": 0,
            "isVerified": false,
            "komenci": true,
            "numAttestationsRemaining": 3,
            "total": 0,
          },
          "withoutRevealing": false,
        },
        "walletConnect": Object {
          "v1": Object {
            "pendingActions": Array [],
            "pendingSessions": Array [],
            "sessions": Array [],
          },
          "v2": Object {
            "pendingActions": Array [],
            "pendingSessions": Array [],
            "sessions": Array [],
          },
        },
        "web3": Object {
          "account": "0x0000000000000000000000000000000000007E57",
          "accountInWeb3Keystore": "0x0000000000000000000000000000000000007E57",
          "commentKey": undefined,
          "contractKitReady": false,
          "dataEncryptionKey": "0x0000000000000000000000000000000000008F68",
          "fornoMode": true,
          "gasPriceLastUpdated": 0,
          "hadFornoDisabled": true,
          "isDekRegistered": false,
          "latestBlockNumber": 0,
          "mtwAddress": null,
          "syncProgress": Object {
            "currentBlock": 0,
            "highestBlock": 0,
            "startingBlock": 0,
          },
        },
      }
    `)
  })
})
