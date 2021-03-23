import { saveTxHashProvider } from '../firebase'
import { Provider } from './Provider'
import { rampWebhook } from './rampWebhook'

const mockVerify = jest.fn()

jest.mock('../firebase')
jest.mock('crypto', () => ({
  ...(jest.requireActual('crypto') as any),
  createVerify: jest.fn(() => ({
    update: jest.fn(),
    verify: mockVerify,
  })),
}))
jest.mock('../config', () => ({ RAMP_KEY: 'rampStaging.pem' }))

describe('Ramp cash in', () => {
  const response: any = {
    status: jest.fn(() => response),
    send: jest.fn(),
    end: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('POST /ramp - success', async () => {
    mockVerify.mockReturnValue(true)
    const request: any = {
      body: {
        type: 'RELEASED',
        purchase: {
          receiverAddress: '0x123',
          actions: [
            {
              newStatus: 'RELEASED',
              details: '0x456',
            },
          ],
        },
      },
      header: (head: string) => (head === 'X-Body-Signature' ? 'test signature' : undefined),
    }
    await rampWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(204)
    expect(saveTxHashProvider).toHaveBeenCalledTimes(1)
    expect(saveTxHashProvider).toHaveBeenCalledWith('0x123', '0x456', Provider.Ramp)
  })

  it('POST /ramp - wrong signature', async () => {
    mockVerify.mockReturnValue(false)
    const request: any = {
      body: {
        type: 'RELEASED',
        purchase: {
          receiverAddress: '0x123',
          actions: [
            {
              newStatus: 'RELEASED',
              details: '0x456',
            },
          ],
        },
      },
      header: (head: string) => (head === 'X-Body-Signature' ? 'test signature' : undefined),
    }
    await rampWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })

  it('POST /ramp - no tx hash', async () => {
    mockVerify.mockReturnValue(true)
    const request: any = {
      body: {
        type: 'RELEASED',
        purchase: {
          receiverAddress: '0x123',
          actions: [
            {
              newStatus: 'RELEASED',
              details: undefined,
            },
          ],
        },
      },
      header: (head: string) => (head === 'X-Body-Signature' ? 'test signature' : undefined),
    }
    await rampWebhook(request, response)

    expect(response.status).toHaveBeenCalledWith(204)
    expect(saveTxHashProvider).not.toHaveBeenCalled()
  })
})
