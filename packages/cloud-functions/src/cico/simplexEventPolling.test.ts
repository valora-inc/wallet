import { FetchMock } from 'jest-fetch-mock/types'
import { trackEvent } from '../bigQuery'
import { simplexEventPolling } from './simplexEventPolling'
import { lookupAddressFromTxId } from './utils'

jest.mock('./utils', () => ({
  ...(jest.requireActual('./utils') as any),
  lookupAddressFromTxId: jest.fn(
    () => new Promise<string>((res) => res('0x123'))
  ),
}))

const mockEventResponse = {
  events: [
    {
      event_id: '0001',
      name: 'payment_simplexcc_approved',
      payment: {
        id: '1234',
        status: 'accepted',
        created_at: '2021-01-01 12:00',
        partner_id: 911,
        updated_at: '2021-01-01 12:00',
        crypto_currency: 'cusd',
        fiat_total_amount: {
          amount: 101,
          currency: 'usd',
        },
        crypto_total_amount: {
          amount: 100,
          currency: 'cusd',
        },
        partner_end_user_id: 'clabs',
      },
      timestamp: '2021-01-01 12:00',
    },
  ],
}

describe('Simplex event polling', () => {
  const mockFetch = fetch as FetchMock
  const response: any = {
    status: jest.fn(() => response),
    send: jest.fn(),
    end: jest.fn(),
  }

  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('successfully parses polled events', async () => {
    mockFetch.mockResponses(JSON.stringify(mockEventResponse), 'deleted')

    await simplexEventPolling({} as any, response)

    expect(lookupAddressFromTxId).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(response.status).toHaveBeenCalledWith(204)
    mockFetch.mockClear()
  })
})
