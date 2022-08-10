import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Welcome from 'src/onboarding/welcome/Welcome'
import { createMockStore } from 'test/utils'

describe('Welcome', () => {
  it('renders and behaves correctly', () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <Welcome /*{...getMockStackScreenProps(Screens.)}*/ />
      </Provider>
    )

    fireEvent.press(getByTestId('CreateAccountButton'))
    jest.runOnlyPendingTimers()
    expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "type": "ACCOUNT/CHOOSE_CREATE",
        },
      ]
    `)

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

  it('render header title correctly when createAccountCopyTestConfig is "control"', () => {
    const store = createMockStore({
      app: {
        createAccountCopyTestConfig: 'control',
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <Welcome />
      </Provider>
    )

    expect(queryByTestId('CreateAccountButton')).toHaveTextContent('welcome.createAccount')
    expect(queryByTestId('RestoreAccountButton')).toHaveTextContent('welcome.restoreAccount')
  })

  it('render header title correctly when createAccountCopyTestConfig is "treatment1"', () => {
    const store = createMockStore({
      app: {
        createAccountCopyTestConfig: 'treatment1',
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <Welcome />
      </Provider>
    )

    expect(queryByTestId('CreateAccountButton')).toHaveTextContent('welcome.createNewWallet')
    expect(queryByTestId('RestoreAccountButton')).toHaveTextContent('welcome.restoreWallet')
  })

  it('render header title correctly when createAccountCopyTestConfig is "treatment2"', () => {
    const store = createMockStore({
      app: {
        createAccountCopyTestConfig: 'treatment2',
      },
    })
    const { queryByTestId } = render(
      <Provider store={store}>
        <Welcome />
      </Provider>
    )

    expect(queryByTestId('CreateAccountButton')).toHaveTextContent('welcome.createNewWallet')
    expect(queryByTestId('RestoreAccountButton')).toHaveTextContent('welcome.iAlreadyHaveAWallet')
  })
})
