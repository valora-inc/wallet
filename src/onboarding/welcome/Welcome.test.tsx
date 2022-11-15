import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { CreateAccountCopyTestType } from 'src/app/types'
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

  it('render header title correctly when createAccountCopyTestType is "Account"', () => {
    const store = createMockStore({
      app: {
        createAccountCopyTestType: CreateAccountCopyTestType.Account,
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

  it('render header title correctly when createAccountCopyTestType is "Wallet"', () => {
    const store = createMockStore({
      app: {
        createAccountCopyTestType: CreateAccountCopyTestType.Wallet,
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

  it('render header title correctly when createAccountCopyTestType is "AlreadyHaveWallet"', () => {
    const store = createMockStore({
      app: {
        createAccountCopyTestType: CreateAccountCopyTestType.AlreadyHaveWallet,
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

it('renders welcome text correctly when showGuidedOnboardingCopy is true', () => {
  const store = createMockStore({
    app: {
      showGuidedOnboardingCopy: true,
    },
  })
  const { queryByTestId } = render(
    <Provider store={store}>
      <Welcome />
    </Provider>
  )
  expect(queryByTestId('WelcomeText')).toHaveTextContent('welcome.titleGuided')
})

it('render welcome text correctly when showGuidedOnboardingCopy is false', () => {
  const store = createMockStore({
    app: {
      showGuidedOnboardingCopy: false,
    },
  })
  const { queryByTestId } = render(
    <Provider store={store}>
      <Welcome />
    </Provider>
  )
  expect(queryByTestId('WelcomeText')).toHaveTextContent('welcome.title')
})
