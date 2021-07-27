import { saveTxHashProvider } from '../firebase'
import { Providers } from './Providers'
import { xanpoolwebhook } from './xanpoolWebhook'

const mockVerify = jest.fn()

jest.mock('../firebase')
jest.mock('crypto', () => ({
  ...(jest.requireActual('crypto') as any),
  createVerify: jest.fn(() => ({
    update: jest.fn(),
    verify: mockVerify,
  })),
}))
jest.mock('../config', () => ({ MOONPAY_DATA: { webhook_key: 'some_key' } }))

describe('Xanpool cash in', () => {
  const response: any = {
    status: jest.fn(() => response),
    send: jest.fn(),
    end: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /xanpool - success', async () => {
    const request: any = {
      body: {
        timestamp: '2021-07-01',
        message: 'mock',
        payload: {
          cryptoCurrency: 'cusd',
          currency: 'usd',
          fiat: 100,
          crypto: 99,
          wallet: '0x123',
          blockchainTxId: '0x456',
        },
      },
    }
    await xanpoolwebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(204)
    expect(saveTxHashProvider).toHaveBeenCalledTimes(1)
    expect(saveTxHashProvider).toHaveBeenCalledWith('0x123', '0x456', Providers.Xanpool)
  })

  it('POST /xanpool - no tx id', async () => {
    const request: any = {
      body: {
        timestamp: '2021-07-01',
        message: 'mock',
        payload: {
          cryptoCurrency: 'cusd',
          currency: 'usd',
          fiat: 100,
          crypto: 99,
        },
      },
    }
    await xanpoolwebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(204)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })
})
