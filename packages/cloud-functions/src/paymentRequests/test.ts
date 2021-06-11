import { notifyPaymentRequest, PaymentRequestStatus } from '.'
import { Currencies } from '../notifications/types'

const saveRequestMock = jest.fn()
const sendNotificationMock = jest.fn()

jest.mock('../firebase', () => ({
  database: () => ({
    ref: jest.fn((path: string) => ({
      update: (payload: any) => saveRequestMock(path, payload),
    })),
  }),
}))
jest.mock('../notifications', () => ({
  getTranslatorForAddress: () => Promise.resolve(jest.fn((x) => x)),
  sendNotification: (...args: any[]) => sendNotificationMock(...args),
}))

const mockId = '123'
const mockAmount = '10'
const requesterAddress = '0x345'
const requesteeAddress = '0x654'
function createMockPaymentRequest(overrides: any = {}) {
  return {
    amount: mockAmount,
    requesterAddress,
    requesteeAddress,
    currency: Currencies.Dollar,
    status: PaymentRequestStatus.REQUESTED,
    notified: true,
    ...overrides,
  }
}

describe('notifyPaymentRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('skip when already notified', async () => {
    await notifyPaymentRequest(mockId, createMockPaymentRequest({ notified: true }))

    expect(saveRequestMock).not.toHaveBeenCalled()
    expect(sendNotificationMock).not.toHaveBeenCalled()
  })

  it('sends notification and marks as notified if not notified', async () => {
    await notifyPaymentRequest(mockId, createMockPaymentRequest({ notified: false }))

    expect(saveRequestMock).toHaveBeenCalledWith(`/pendingRequests/${mockId}`, {
      notified: true,
    })
    expect(sendNotificationMock).toHaveBeenCalledWith(
      'paymentRequestedTitle',
      'paymentRequestedBody',
      requesteeAddress,
      expect.objectContaining({
        uid: mockId,
        requesterAddress,
        requesteeAddress,
        amount: mockAmount,
        currency: Currencies.Dollar,
        status: PaymentRequestStatus.REQUESTED,
      })
    )
  })
})
