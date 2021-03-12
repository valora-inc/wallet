import { Any } from '../src/events/Any'
import { metrics } from '../src/metrics'

// Wrap counters in a class like this: https://github.com/celo-org/celo-oracle/blob/main/test/exchange_adapters/base.test.ts#L78

// mock the input context (or something)
// finish this describe block
// call any.getEvent
// expect the counter to be incremented

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
