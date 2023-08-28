import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { PaymentRequest, WriteablePaymentRequest } from 'src/paymentRequest/types'
import {
  decryptPaymentRequest,
  encryptPaymentRequest,
  transactionDataFromPaymentRequest,
} from 'src/paymentRequest/utils'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { TokenBalance } from 'src/tokens/slice'
import { doFetchDataEncryptionKey } from 'src/web3/dataEncryptionKey'
import {
  mockAccount,
  mockAccount2,
  mockCeurAddress,
  mockCusdAddress,
  mockE164Number,
  mockName,
  mockPaymentRequests,
  mockPrivateDEK,
  mockPublicDEK,
  mockPublicDEK2,
  mockRecipient,
  mockTokenBalances,
} from 'test/values'

jest.mock('crypto', () => ({
  ...(jest.requireActual('crypto') as any),
  randomBytes: jest.fn(() => Buffer.from(new Uint8Array(16).fill(1))),
}))

const req = mockPaymentRequests[0]

describe('getRequesterFromPaymentRequest', () => {
  const address = req.requesterAddress
  const addressToE164Number = { [address]: mockE164Number }
  const phoneRecipientCache = { [mockE164Number]: mockRecipient }

  it('gets requester when only address is known', () => {
    const recipient = getRecipientFromAddress(address, {
      phoneRecipientCache: {},
      valoraRecipientCache: {},
      addressToE164Number: {},
      addressToDisplayName: {},
    })
    expect(recipient).toMatchObject({
      address,
    })
  })

  it('gets requester when address is cached but not recipient', () => {
    const recipient = getRecipientFromAddress(address, {
      phoneRecipientCache: {},
      valoraRecipientCache: {},
      addressToE164Number,
      addressToDisplayName: {},
    })
    expect(recipient).toMatchObject({
      address,
      e164PhoneNumber: mockE164Number,
    })
  })

  it('gets requester when address and recip are cached', () => {
    const recipient = getRecipientFromAddress(address, {
      phoneRecipientCache,
      valoraRecipientCache: {},
      addressToE164Number,
      addressToDisplayName: {},
    })
    expect(recipient).toMatchObject({
      address,
      e164PhoneNumber: mockE164Number,
      name: mockName,
    })
  })
})

describe('getRequesteeFromPaymentRequest', () => {
  const address = req.requesteeAddress
  const addressToE164Number = { [address]: mockE164Number }
  const phoneRecipientCache = { [mockE164Number]: mockRecipient }

  it('gets requestee when only address is known', () => {
    const recipient = getRecipientFromAddress(address, {
      phoneRecipientCache: {},
      valoraRecipientCache: {},
      addressToE164Number: {},
      addressToDisplayName: {},
    })
    expect(recipient).toMatchObject({
      address,
    })
  })

  it('gets requestee when address is cached but not recipient', () => {
    const recipient = getRecipientFromAddress(address, {
      phoneRecipientCache: {},
      valoraRecipientCache: {},
      addressToE164Number,
      addressToDisplayName: {},
    })
    expect(recipient).toMatchObject({
      address,
      e164PhoneNumber: mockE164Number,
    })
  })

  it('gets requestee when address and recip are cached', () => {
    const recipient = getRecipientFromAddress(address, {
      phoneRecipientCache,
      valoraRecipientCache: {},
      addressToE164Number,
      addressToDisplayName: {},
    })
    expect(recipient).toMatchObject({
      address,
      e164PhoneNumber: mockE164Number,
      name: mockName,
    })
  })
})

const encryptedPaymentReq: PaymentRequest = {
  ...req,
  comment:
    'BNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBBhjruDecYg9fsrPNcQbI3AkcvWra1MHIeOZlcycn7Vqtx+UVNR59A3kqdIDbLuGiBNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBCVYJWqi/TZNXbAR9ziyX5MJCtfdulxA1tjlvHR/xpE6WnlC/kyXAfKIMqgKGJXchAQEBAQEBAQEBAQEBAQEBARp3jJ/hhfo07KIzSedfKMnSa2tt4odkbNB5oTBMlVzqyKA8zwTyZiTMr7IkE8y0hoBwRaK8GrXEzen9ycr4NIJ0yuJV8WNU7uU3NWnr3FhiQ60CtYiserbpwphRlzGvbL0hurQRjw==',
  requesterE164Number:
    'BNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBBhjruDecYg9fsrPNcQbI3AkcvWra1MHIeOZlcycn7Vqtx+UVNR59A3kqdIDbLuGiBNFXzyIGjZqqNyq6r35aV2HlMMqUbGnIqboReD77MwAlI5IyzqLQ99WF5B1bsZSVS1K+7trtJtKGhIdI1vbSJSsBAQEBAQEBAQEBAQEBAQEBCVYJWqi/TZNXbAR9ziyX5MJCtfdulxA1tjlvHR/xpE6WnlC/kyXAfKIMqgKGJXchAQEBAQEBAQEBAQEBAQEBAXV31J+7haU0vKJ0SfJfe8mNaylt8oc5bKobMysx91ue1mBc8aLBawM5KfuZyKDBgckvD43PvjQ5',
}

const encryptedWritablePaymentReq: WriteablePaymentRequest = {
  ...encryptedPaymentReq,
  createdAt: new Date(encryptedPaymentReq.createdAt),
}

describe('transactionDataFromPaymentRequest', () => {
  const getStableTokens = ({
    cusdBalance,
    ceurBalance,
  }: {
    cusdBalance: number
    ceurBalance: number
  }): TokenBalance[] => {
    return [
      {
        ...mockTokenBalances[mockCusdAddress],
        balance: BigNumber(cusdBalance),
        usdPrice: BigNumber(1),
        lastKnownUsdPrice: null,
      },
      {
        ...mockTokenBalances[mockCeurAddress],
        balance: BigNumber(ceurBalance),
        usdPrice: BigNumber(1),
        lastKnownUsdPrice: null,
      },
    ]
  }

  const paymentRequest = {
    ...req,
    amount: '0.5',
  }
  it('Uses cUsd by default if there is sufficient cUsd and cEur balance', () => {
    const transactionData = transactionDataFromPaymentRequest({
      paymentRequest,
      stableTokens: getStableTokens({ cusdBalance: 1, ceurBalance: 1 }),
      requester: mockRecipient,
    })

    expect(transactionData).toMatchObject({
      recipient: mockRecipient,
      inputAmount: BigNumber(0.5),
      amountIsInLocalCurrency: false,
      tokenAddress: mockCusdAddress,
      tokenAmount: BigNumber(0.5),
    })
  })

  it('Uses cEur by default if there is not enough cUsd balance', () => {
    const transactionData = transactionDataFromPaymentRequest({
      paymentRequest,
      stableTokens: getStableTokens({ cusdBalance: 0, ceurBalance: 1 }),
      requester: mockRecipient,
    })

    expect(transactionData).toMatchObject({
      recipient: mockRecipient,
      inputAmount: BigNumber(0.5),
      amountIsInLocalCurrency: false,
      tokenAddress: mockCeurAddress,
      tokenAmount: BigNumber(0.5),
    })
  })

  it('Throws error if neither currency has enough balance', () => {
    expect(() =>
      transactionDataFromPaymentRequest({
        paymentRequest,
        stableTokens: getStableTokens({ cusdBalance: 0, ceurBalance: 0 }),
        requester: mockRecipient,
      })
    ).toThrow()
  })
})

describe('Encrypt Payment Request', () => {
  const writableRequest: WriteablePaymentRequest = {
    ...mockPaymentRequests[0],
    createdAt: new Date(mockPaymentRequests[0].createdAt),
  }
  it('Encrypts valid payment request', async () => {
    await expectSaga(encryptPaymentRequest, writableRequest)
      .provide([
        [call(doFetchDataEncryptionKey, mockAccount), mockPublicDEK],
        [call(doFetchDataEncryptionKey, mockAccount2), mockPublicDEK2],
      ])
      .returns(encryptedWritablePaymentReq)
      .run()
  })

  it('Does not encrypt when a DEK is missing', async () => {
    const sanitizedReq = {
      ...writableRequest,
      requesterE164Number: undefined,
    }
    await expectSaga(encryptPaymentRequest, writableRequest)
      .provide([
        [call(doFetchDataEncryptionKey, mockAccount), mockPublicDEK],
        [call(doFetchDataEncryptionKey, mockAccount2), null],
      ])
      .returns(sanitizedReq)
      .run()
  })
})

describe('Decrypt Payment Request', () => {
  it('Derypts valid payment request', () => {
    expect(decryptPaymentRequest(encryptedPaymentReq, mockPrivateDEK, false)).toMatchObject(req)
  })

  it('Handles unencrypted payment request correctly', () => {
    expect(decryptPaymentRequest(req, mockPrivateDEK, false)).toMatchObject(req)
  })
})
