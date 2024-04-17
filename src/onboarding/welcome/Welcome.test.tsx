import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import Welcome from 'src/onboarding/welcome/Welcome'
import { patchUpdateStatsigUser } from 'src/statsig'
import { createMockStore } from 'test/utils'

jest.mock('src/onboarding/steps')
jest.mock('src/statsig', () => ({
  ...(jest.requireActual('src/statsig') as any),
  patchUpdateStatsigUser: jest.fn(),
}))

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
    await Promise.resolve() // waits for patchUpdateStatsigUser promise to resolve
    expect(patchUpdateStatsigUser).toHaveBeenCalledWith({ custom: { startOnboardingTime: 123 } })
    expect(store.getActions()).toMatchInlineSnapshot(`
      [
        {
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
      [
        {
          "type": "ACCOUNT/CHOOSE_RESTORE",
        },
      ]
    `)
  })
  it('goes to the onboarding screen', async () => {
    const store = createMockStore({
      account: {
        acceptedTerms: true,
      },
    })
    jest.mocked(firstOnboardingScreen).mockReturnValue(Screens.PincodeSet)
    const { getByTestId } = render(
      <Provider store={store}>
        <Welcome />
      </Provider>
    )

    fireEvent.press(getByTestId('CreateAccountButton'))
    jest.runOnlyPendingTimers()
    await Promise.resolve() // waits for patchUpdateStatsigUser promise to resolve
    expect(firstOnboardingScreen).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
  })
})
