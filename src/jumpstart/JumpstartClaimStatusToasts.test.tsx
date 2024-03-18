import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import JumpstartClaimStatusToasts from 'src/jumpstart/JumpstartClaimStatusToasts'
import { jumpstartClaimErrorDismissed } from 'src/jumpstart/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')
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

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_claim_error_dismissed
    )
    expect(store.dispatch).toHaveBeenCalledWith(jumpstartClaimErrorDismissed())
  })

  it('handles contact support correctly', () => {
    const { store, getByText } = renderComponent()

    fireEvent.press(getByText('jumpstartStatus.error.contactSupport'))

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_claim_error_contact_support
    )
    expect(store.dispatch).toHaveBeenCalledWith(jumpstartClaimErrorDismissed())
    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
  })
})
