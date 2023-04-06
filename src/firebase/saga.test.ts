import { waitForAction } from 'src/firebase/saga'
import { expectSaga } from 'redux-saga-test-plan'
import { call, take } from 'redux-saga/effects'

describe('firebase saga', () => {
  it('waitForAction', async () => {
    const testEffect = jest.fn()
    const action = 'TestAction'
    const testSaga = function* () {
      yield waitForAction(action as any)
      yield call(testEffect, 'done waiting')
    }
    // calls testEffect only after action is dispatched
    await expectSaga(testSaga)
      .not.call(testEffect)
      .provide([[take(action), action]])
      .call(testEffect, 'done waiting')
      .run()
    // calls testEffect without waiting for action after the first time
    await expectSaga(testSaga).call(testEffect, 'done waiting').run()
  })
})
