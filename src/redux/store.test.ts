import Ajv from 'ajv'
import * as createMigrateModule from 'src/redux/createMigrate'
import { migrations } from 'src/redux/migrations'
import { setupStore, _persistConfig } from 'src/redux/store'
import * as accountCheckerModule from 'src/utils/accountChecker'
import { getLatestSchema, vNeg1Schema } from 'test/schemas'

// Mock sagas because we don't want them to run in this test
jest.mock('src/redux/sagas', () => ({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
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
  // See https://github.com/valora-inc/wallet/tree/main/WALLET.md#redux-state-migration
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

    // console.log('Validation errors:', validate.errors?.length, validate.errors)
    expect(validate.errors).toBeNull()
    expect(isValid).toBe(true)

    // Make sure the state looks the way we expect it to.
    // This should help catch unintentional changes to the state, caused by incorrect migrations
    expect(data).toMatchInlineSnapshot(`
      Object {
        "_persist": Object {
          "rehydrated": true,
          "version": 51,
        },
        "account": Object {
          "acceptedTerms": false,
          "accountCreationTime": 99999999999999,
          "accountToRecoverFromStoreWipe": undefined,
          "backupCompleted": false,
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
          "dismissedKeepSupercharging": false,
          "dismissedStartSupercharging": false,
          "e164PhoneNumber": "+14155556666",
          "finclusiveKycStatus": 0,
          "finclusiveRegionSupported": false,
          "hasLinkedBankAccount": false,
          "hasMigratedToNewBip39": false,
          "kycStatus": undefined,
          "name": "John Doe",
          "photosNUXClicked": false,
          "pictureUri": null,
          "pincodeType": "Unset",
          "profileUploaded": false,
          "promptFornoIfNeeded": false,
          "recoveringFromStoreWipe": false,
          "retryVerificationWithForno": true,
        },
        "alert": null,
        "app": Object {
          "activeDapp": null,
          "activeScreen": "Main",
          "analyticsEnabled": true,
          "appState": "Active",
          "biometryEnabled": false,
          "cashInButtonExpEnabled": false,
          "celoEducationUri": null,
          "celoEuroEnabled": true,
          "celoWithdrawalEnabledInExchange": true,
          "dappListApiUrl": null,
          "dappsWebViewEnabled": false,
          "finclusiveUnsupportedStates": Array [
            "NY",
            "TX",
          ],
          "googleMobileServicesAvailable": undefined,
          "hideVerification": false,
          "huaweiMobileServicesAvailable": undefined,
          "inviteModalVisible": false,
          "lastTimeBackgrounded": 0,
          "linkBankAccountEnabled": false,
          "linkBankAccountStepTwoEnabled": false,
          "locked": false,
          "logPhoneNumberTypeEnabled": false,
          "loggedIn": false,
          "maxNumRecentDapps": 0,
          "minVersion": null,
          "numberVerified": false,
          "paymentDeepLinkHandler": "",
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
          "sentryNetworkErrors": Array [
            "network request failed",
            "The network connection was lost",
          ],
          "sentryTracesSampleRate": 0.2,
          "sessionId": "",
          "showPriceChangeIndicatorInBalances": false,
          "showRaiseDailyLimitTarget": undefined,
          "skipProfilePicture": false,
          "skipVerification": false,
          "superchargeApy": 25,
          "superchargeButtonType": "PILL_REWARDS",
          "superchargeTokens": Array [],
          "supportedBiometryType": null,
          "walletConnectV1Enabled": true,
        },
        "escrow": Object {
          "isReclaiming": false,
          "sentEscrowedPayments": Array [],
        },
        "exchange": Object {
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
          "e164NumberToAddress": Object {},
          "e164NumberToSalt": Object {},
          "hasSeenVerificationNux": false,
          "importContactsProgress": Object {
            "current": 0,
            "status": 0,
            "total": 0,
          },
          "lastRevealAttempt": null,
          "matchedContacts": Object {},
          "numCompleteAttestations": 0,
          "secureSendPhoneNumberMapping": Object {},
          "verificationStatus": 0,
          "walletToAccountAddress": Object {},
        },
        "imports": Object {
          "isImportingWallet": false,
        },
        "localCurrency": Object {
          "error": false,
          "exchangeRates": Object {
            "cEUR": null,
            "cGLD": null,
            "cUSD": "1.33",
          },
          "fetchedCurrencyCode": "PHP",
          "isLoading": false,
          "preferredCurrencyCode": "PHP",
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
          "showSendToAddressWarning": true,
        },
        "stableToken": Object {
          "balances": Object {
            "cEUR": null,
            "cUSD": null,
          },
          "educationCompleted": false,
          "lastFetch": null,
        },
        "supercharge": Object {
          "availableRewards": Array [],
          "error": false,
          "fetchAvailableRewardsError": false,
          "fetchAvailableRewardsLoading": false,
          "loading": false,
        },
        "tokens": Object {
          "error": false,
          "loading": false,
          "tokenBalances": Object {},
        },
        "transactions": Object {
          "inviteTransactions": Object {},
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
        },
        "web3": Object {
          "account": "0x0000000000000000000000000000000000007E57",
          "accountInWeb3Keystore": "0x0000000000000000000000000000000000007E57",
          "dataEncryptionKey": "0x0000000000000000000000000000000000008F68",
          "fornoMode": true,
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
