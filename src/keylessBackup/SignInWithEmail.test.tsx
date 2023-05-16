import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SignInWithEmail from 'src/keylessBackup/SignInWithEmail'
import { googleSignInStarted } from 'src/keylessBackup/slice'
import { createMockStore } from 'test/utils'

describe('SignInWithEmail', () => {
  const store = createMockStore()

  beforeEach(() => {
    jest.clearAllMocks()
    store.dispatch = jest.fn()
  })

  it('pressing sign in with google emits analytics event and dispatches action', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <SignInWithEmail />
      </Provider>
    )
    const continueButton = getByTestId('SignInWithEmail/Google')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('sign_in_with_google')
    expect(store.dispatch).toHaveBeenCalledWith(googleSignInStarted())
  })
})
