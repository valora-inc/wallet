import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { initialState as exchangeInitialState } from 'src/exchange/reducer'
import { migrations } from 'src/redux/migrations'
import { Currency } from 'src/utils/currencies'
import {
  v0Schema,
  v13Schema,
  v14Schema,
  v15Schema,
  v16Schema,
  v17Schema,
  v18Schema,
  v1Schema,
  v2Schema,
  v7Schema,
  v8Schema,
  vNeg1Schema,
} from 'test/schemas'

describe('Redux persist migrations', () => {
  it('works for v-1 to v0', () => {
    const mockNumber = '+111111111111'
    const mockAddress = '0x00000000000000000000'
    const vNeg1Stub = {
      ...vNeg1Schema,
      identity: {
        ...vNeg1Schema.identity,
        e164NumberToAddress: { [mockNumber]: mockAddress },
      },
    }
    const migratedSchema = migrations[0](vNeg1Stub)
    expect(migratedSchema.identity.e164NumberToAddress).toEqual({ [mockNumber]: [mockAddress] })
  })

  it('works for v0 to v1', () => {
    const mockNumber = '+111111111111'
    const mockAddress = '0x00000000000000000000'
    const v0Stub = {
      ...v0Schema,
      invite: {
        ...v0Schema.invite,
        invitees: {
          [mockAddress]: mockNumber,
        },
      },
    }
    const migratedSchema = migrations[1](v0Stub)
    expect(migratedSchema.invite.invitees[0].tempWalletAddress).toEqual(mockAddress)
  })

  it('works for v1 to v2', () => {
    const v1Stub = {
      ...v1Schema,
      app: {
        ...v1Schema.app,
        numberVerified: true,
      },
    }
    const migratedSchema = migrations[2](v1Stub)
    expect(migratedSchema.app.numberVerified).toEqual(false)
  })

  it('works for v2 to v3', () => {
    const v2Stub = {
      ...v2Schema,
      send: {
        ...v2Schema.send,
        recentPayments: [{ timestamp: Date.now(), amount: '100' }],
      },
      account: {
        ...v2Schema.account,
        hasMigratedToNewBip39: false,
      },
    }
    const migratedSchema = migrations[3](v2Stub)
    expect(migratedSchema.send.recentPayments.length).toEqual(0)
  })

  it('works for v3 to v4', () => {
    const v3Stub = {
      ...v2Schema,
      identity: {
        ...v2Schema.identity,
        acceptedAttestationCodes: [{ code: 'code', issuer: 'issuer' }],
      },
    }
    const migratedSchema = migrations[4](v3Stub)
    expect(migratedSchema.identity.acceptedAttestationCodes.length).toEqual(0)
  })

  it('works for v4 to v5', () => {
    const v4Stub = {
      account: {
        incomingPaymentRequests: [1, 2, 3],
        outgoingPaymentRequests: [],
      },
      web3: {
        commentKey: 'key',
      },
    }
    const migratedSchema = migrations[5](v4Stub)
    expect(migratedSchema.paymentRequest.incomingPaymentRequests).toMatchObject([1, 2, 3])
    expect(migratedSchema.paymentRequest.outgoingPaymentRequests).toMatchObject([])
    expect(migratedSchema.account.incomingPaymentRequests).toBe(undefined)
    expect(migratedSchema.account.outgoingPaymentRequests).toBe(undefined)
    expect(migratedSchema.web3.dataEncryptionKey).toBe('key')
    expect(migratedSchema.web3.commentKey).toBe(undefined)
  })

  it('works for v5 to v6', () => {
    const v5Stub = {
      invite: {
        redeemComplete: false,
      },
      web3: {
        account: 'some_account',
      },
    }
    const migratedSchema = migrations[6](v5Stub)
    expect(migratedSchema.invite.redeemComplete).toBe(true)
  })

  it('works for v6 to v7', () => {
    const mockAddress = '0x00000000000000000000'
    const mockName = 'Mock Name'

    const v6Stub = {
      identity: {
        addressToDisplayName: {
          [mockAddress]: mockName,
        },
      },
    }
    const migratedSchema = migrations[7](v6Stub)
    expect(Object.keys(migratedSchema.identity.addressToDisplayName).length).toEqual(1)
    expect(migratedSchema.identity.addressToDisplayName[mockAddress].name).toEqual(mockName)
    expect(migratedSchema.identity.addressToDisplayName[mockAddress].imageUrl).toBeNull()
  })

  it('works for v7 to v8', () => {
    const txHash = '0x00000000000000000000'
    const mockName = 'Mock Name'
    const mockIcon = 'Mock icon'

    const v7Stub = {
      fiatExchanges: {
        txHashToProvider: {
          [txHash]: {
            name: mockName,
            icon: mockIcon,
          },
        },
        lastUsedProvider: {
          name: 'Simplex',
          icon: mockIcon,
        },
      },
    }
    const migratedSchema = migrations[8](v7Stub)
    expect(Object.keys(migratedSchema.fiatExchanges.txHashToProvider).length).toEqual(1)
    expect(migratedSchema.fiatExchanges.txHashToProvider[txHash].name).toEqual(mockName)
    expect(migratedSchema.fiatExchanges.txHashToProvider[txHash].icon).toEqual(mockIcon)
    expect(migratedSchema.fiatExchanges.lastUsedProvider).toEqual('Simplex')
  })

  it('works for v8 to v9', () => {
    const v8Stub = {
      account: {
        dailyLimitCusd: 500,
      },
    }
    const migratedSchema = migrations[9](v8Stub)
    expect(migratedSchema.account.dailyLimitCusd).toEqual(DEFAULT_DAILY_PAYMENT_LIMIT_CUSD)
  })
  it('works for v9 to v10', () => {
    const v9Stub = v7Schema
    const migratedSchema = migrations[10](v9Stub)
    expect(migratedSchema.identity.feelessAttestationCodes).toBeUndefined()
    expect(migratedSchema.identity.feelessProcessingInputCode).toBeUndefined()
    expect(migratedSchema.identity.feelessAcceptedAttestationCodes).toBeUndefined()
    expect(migratedSchema.identity.feelessNumCompleteAttestations).toBeUndefined()
    expect(migratedSchema.identity.feelessVerificationStatus).toBeUndefined()
    expect(migratedSchema.identity.verificationState).toBeUndefined()
    expect(migratedSchema.identity.feelessVerificationState).toBeUndefined()
    expect(migratedSchema.identity.feelessLastRevealAttempt).toBeUndefined()
  })
  it('works for v10 to v11', () => {
    const migratedSchema = migrations[11](v8Schema)
    expect(migratedSchema.app.pontoEnabled).toBeUndefined()
    expect(migratedSchema.app.kotaniEnabled).toBeUndefined()
    expect(migratedSchema.app.bitfyUrl).toBeUndefined()
    expect(migratedSchema.app.flowBtcUrl).toBeUndefined()
  })
  it('works for v11 to v12', () => {
    const appStub = 'dont delete please'
    const exchangeStub = 'also dont delete please'
    const stub = {
      exchange: {
        otherExchangeProps: exchangeStub,
        history: {
          celoGoldExchangeRates: [1, 2, 3],
          aggregatedExchangeRates: [4, 5, 6],
          granularity: 0,
          range: 0,
          lastTimeUpdated: 100,
        },
      },
      app: appStub,
    }
    const migratedSchema = migrations[12](stub)
    expect(migratedSchema.app).toEqual(appStub)
    expect(migratedSchema.exchange.otherExchangeProps).toEqual(exchangeStub)
    expect(migratedSchema.exchange.history).toEqual(exchangeInitialState.history)
  })
  it('works for v12 to v13', () => {
    const stub = {
      verify: {
        existingProperty: 'verify_existingProperty',
        TEMPORARY_override_withoutVerification: 'oldValue',
        withoutRevealing: true,
        retries: 3,
      },
      identity: {
        existingProperty: 'identity_existingProperty',
        hasSeenVerificationNux: true,
        attestationCodes: ['code1', 'code2'],
        acceptedAttestationCodes: ['code1'],
        attestationInputStatus: ['loading'],
        numCompleteAttestations: 3,
        verificationStatus: 'verified',
        lastRevealAttempt: 'yesterday',
      },
    }
    const migratedSchema = migrations[13](stub)
    expect(migratedSchema.verify.existingProperty).toEqual('verify_existingProperty')
    expect(migratedSchema.identity.existingProperty).toEqual('identity_existingProperty')
    expect(migratedSchema.verify.seenVerificationNux).toEqual(true)
    const deletedIdentityProperties = [
      'attestationCodes',
      'acceptedAttestationCodes',
      'attestationInputStatus',
      'numCompleteAttestations',
      'verificationStatus',
      'lastRevealAttempt',
    ]
    for (const deletedProperty of deletedIdentityProperties) {
      expect(Object.keys(migratedSchema.identity).includes(deletedProperty)).toEqual(false)
    }
    const deletedVerifyProperties = [
      'TEMPORARY_override_withoutVerification',
      'withoutRevealing',
      'retries',
    ]
    for (const deletedProperty of deletedVerifyProperties) {
      expect(Object.keys(migratedSchema.verify).includes(deletedProperty)).toEqual(false)
    }
  })

  it('works for v13 to v14', () => {
    const migratedSchema = migrations[14](v13Schema)
    expect(migratedSchema.networkInfo.userLocationData).toBeDefined()
    expect(migratedSchema.networkInfo.userLocationData.countryCodeAlpha2).toEqual(null)
  })

  it('works for v14 to v15', () => {
    const v14Stub = {
      ...v14Schema,
      verify: {
        ...v14Schema.verify,
        seenVerificationNux: true,
      },
    }
    const migratedSchema = migrations[15](v14Stub)
    expect(migratedSchema.identity.hasSeenVerificationNux).toEqual(true)
    expect(migratedSchema.identity).toMatchInlineSnapshot(`
      Object {
        "acceptedAttestationCodes": Array [],
        "addressToDataEncryptionKey": Object {},
        "addressToDisplayName": Object {},
        "addressToE164Number": Object {},
        "askedContactsPermission": false,
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
        "hasSeenVerificationNux": true,
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
      }
    `)
    expect(migratedSchema.verify).toMatchInlineSnapshot(`
      Object {
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
        "retries": 0,
        "status": Object {
          "completed": 0,
          "isVerified": false,
          "komenci": true,
          "numAttestationsRemaining": 3,
          "total": 0,
        },
        "withoutRevealing": false,
      }
    `)
  })
  it('works for v15 to v16', () => {
    const migratedSchema = migrations[16]({
      ...v15Schema,
      stableToken: {
        ...v15Schema.stableToken,
        balance: '150',
      },
      escrow: {
        isReclaiming: true,
        sentEscrowedPayments: [{ object: 'with keys' }],
      },
    })
    expect(migratedSchema.localCurrency.exchangeRates).toBeDefined()
    expect(migratedSchema.localCurrency.exchangeRates[Currency.Dollar]).toEqual(
      v15Schema.localCurrency.exchangeRate
    )
    expect(migratedSchema.stableToken.balance).toBeUndefined()
    expect(migratedSchema.stableToken.balances[Currency.Dollar]).toEqual('150')
    expect(migratedSchema.escrow.isReclaiming).toBeFalsy()
    expect(migratedSchema.escrow.sentEscrowedPayments.length).toEqual(0)
  })
  it('works for v16 to v17', () => {
    const migratedSchema = migrations[17](v16Schema)
    expect(migratedSchema.fiatExchanges.lastUsedProvider).not.toBeDefined()
  })
  it('works for v17 to v18', () => {
    const migratedSchema = migrations[18](v17Schema)
    expect(migratedSchema.walletConnect.v2.pairings).not.toBeDefined()
  })
  it('works for v18 to v19', () => {
    const migratedSchema = migrations[19](v18Schema)
    expect(migratedSchema.app.showRaiseDailyLimitTarget).not.toBeDefined()
  })
})
