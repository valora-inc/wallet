import { expectSaga } from 'redux-saga-test-plan'
import { call, put } from 'redux-saga/effects'
import { setLoading } from 'src/home/actions'
import { withLoading } from 'src/home/saga'

beforeAll(() => {
  jest.useRealTimers()
})

describe('withLoading Saga', () => {
  test('sets Loading on/off while calling fn', async () => {
    const fn = () => true
    const res = await expectSaga(withLoading(fn)).run()

    expect(res.allEffects).toEqual([put(setLoading(true)), call(fn), put(setLoading(false))])
  })

  test('returns the fn results', () =>
    expectSaga(withLoading(async () => ({ hello: 'world' })))
      .returns({ hello: 'world' })
      .run())

  test('sets Loading off on fn Error', async () => {
    await expect(
      expectSaga(
        withLoading(() => {
          throw new Error()
        })
      )
        .put(setLoading(false))
        .run()
    ).rejects.toEqual(expect.any(Error))
  })
})
