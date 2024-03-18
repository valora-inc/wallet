import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import JumpstartClaimStatusToasts from 'src/jumpstart/JumpstartClaimStatusToasts'
import { jumpstartErrorDismissed } from 'src/jumpstart/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

jest.mock('src/navigator/NavigationService', () => ({
  navigate: jest.fn(),
}))

function renderComponent() {
  const store = createMockStore({
    jumpstart: {
      claimStatus: 'error',
    },
  })
  store.dispatch = jest.fn()

  const screen = render(
    <Provider store={store}>
      <JumpstartClaimStatusToasts />
    </Provider>
  )

  return { store, screen, ...screen }
}

describe('JumpstartClaimStatusError', () => {
  it('handles dismiss correctly', () => {
    const { store, getByText } = renderComponent()

    fireEvent.press(getByText('jumpstartStatus.error.dismiss'))

    expect(store.dispatch).toHaveBeenCalledWith(jumpstartErrorDismissed())
  })

  it('handles contact support correctly', () => {
    const { store, getByText } = renderComponent()

    fireEvent.press(getByText('jumpstartStatus.error.contactSupport'))

    expect(store.dispatch).toHaveBeenCalledWith(jumpstartErrorDismissed())
    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
  })
})
