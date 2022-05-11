import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { VerificationStatus } from 'src/identity/types'
import { Screens } from 'src/navigator/Screens'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

// Lock time so snapshots always show the same countdown value
jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)

const mockRoute = {
  name: Screens.VerificationLoadingScreen as Screens.VerificationLoadingScreen,
  key: '1',
  params: {
    withoutRevealing: false,
  },
}

describe('VerificationLoadingScreen', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createMockStore()}>
        <VerificationLoadingScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly with fail modal', () => {
    const store = createMockStore({
      identity: {
        verificationStatus: VerificationStatus.Failed,
      },
    })
    const { toJSON } = render(
      <Provider store={store}>
        <VerificationLoadingScreen navigation={mockNavigation} route={mockRoute} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
