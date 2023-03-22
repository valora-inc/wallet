import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Welcome from 'src/onboarding/welcome/Welcome'
import { createMockStore } from 'test/utils'
import { Statsig } from 'statsig-react-native'

jest.mock('statsig-react-native')

describe('Welcome', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => 123)
  })
  it('renders and behaves correctly', async () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <Welcome /*{...getMockStackScreenProps(Screens.)}*/ />
      </Provider>
    )
    fireEvent.press(getByTestId('CreateAccountButton'))
    jest.runOnlyPendingTimers()
    await Promise.resolve() // waits for Statsig.updateUser promise to resolve
    expect(Statsig.updateUser).toHaveBeenCalledWith({ custom: { startOnboardingTime: 123 } })
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "now": 123,
          "type": "ACCOUNT/CHOOSE_CREATE",
        },
      ]
    `)
    expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)

    store.clearActions()

    fireEvent.press(getByTestId('RestoreAccountButton'))
    jest.runOnlyPendingTimers()
    expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "type": "ACCOUNT/CHOOSE_RESTORE",
        },
      ]
    `)
  })
})
