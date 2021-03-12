import { Any } from '../src/events/Any'
import { metrics } from '../src/metrics'

jest.mock('../src/metrics')

describe('AnyType', () => {
  it('Should throw an Error when invalid context is received.', async () => {
    let context = {
      userAddress: 'invalidAddress',
      token: 'CUSD',
    }

    let transaction = new Any(context)

    expect(() => {
      transaction.getEvent(null as any)
    }).toThrow(Error)
  })

  it('Should increment get_unknown_transaction_type metric when invalid context is received.', async () => {
    let context = {
      userAddress: 'invalidAddress',
      token: 'CUSD',
    }

    let transaction = new Any(context)
    try {
      transaction.getEvent(null as any)
    } catch (Error) {}

    expect(metrics.unknownTransaction).toBeCalled()
  })
})
