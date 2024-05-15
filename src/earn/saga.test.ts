import { expectSaga } from 'redux-saga-test-plan'
import { depositSubmitSaga } from 'src/earn/saga'
import { depositStart, depositSuccess } from 'src/earn/slice'
import { navigateHome } from 'src/navigator/NavigationService'

describe('depositSubmitSaga', () => {
  it('navigates home', async () => {
    await expectSaga(depositSubmitSaga, {
      type: depositStart.type,
      payload: { amount: '100', tokenId: 'tokenId', preparedTransactions: [] },
    })
      .put(depositSuccess())
      .run()
    expect(navigateHome).toHaveBeenCalled()
  })
})
