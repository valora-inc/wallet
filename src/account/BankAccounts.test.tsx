import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import openPlaid from 'src/account/openPlaid'
import { showError } from 'src/alert/actions'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { deleteFinclusiveBankAccount, getFinclusiveBankAccounts } from 'src/in-house-liquidity'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockNavigation } from 'test/values'
import BankAccounts from './BankAccounts'

const MOCK_PHONE_NUMBER = '+18487623478'
const MOCK_LOGO_SRC =
  'iVBORw0KGgoAAAANSUhEUgAAAJgAAACYCAMAAAAvHNATAAAAk1BMVEUAAAApMoxjaqsdJ4U0PJJ4frYQGn5zebR8grlPV6FdZKhudLFHT5xWXqRpcK4CDXcXkfWNyfj///84ofYGJo8Wie4NT7YLR64HLpcPYMZ/wvhhtPcUgeYScNYDFX9yvfcFHoeUzPhasfdHqPYOWL74/P8JNp/x+P7j8v3N5/y/4fui0/mGxvhouPdSrfcQaM4KP6ZJnyACAAAAD3RSTlMA9pz77zz+Vx/Pr3DcwIcesZaNAAAENUlEQVR42szVuZKDMBBFUa2Y1U+B2KqAckA5tf//68bhTCAM6hbDSUhvNVJLENmqbIyR+EUa05SVFf/GqsJggynU+XW5qjV20LXKxWlsKXGALE8ZXB6q2m5LPbeqRqS6EukoCQKpRBpKg0h/0i6YlSTtrsFE3wUfa8DIWK4F0YBZk7NsCA12uhJkBZIoBM1NIhF5EwQqQzKZutxvpP7O3CAxE3U7rURy0kYc+wwnyG7X7AqUMXb5YRi6j8/HIyxcxt819OPcuj/aeewHQhm9y3ezC5o7TygjdPl1cl9Mq+csszu6ln5yu0z9sqPM7tqrEt88RnfA+MA3cs+mNRFZ5DRDfx+X1UVYF+q7qbCtb12Utsc2RbqQfnbR5gflakrCuIhDk9EHbHk5otcSecwqbPCTI5s8NlTBDaYR9mwdg/aJMB3aZg3C3o7JG2FN4ClCWOfYdAizR1f+6BiNBx+AO31e9Jn9sGM2ywkCQRAuTDxomSpmESULAQGRf97/8ZJTosk2bK96y3dOVaame3obTb+4vBD+eprPXpi36OI/HHybK/uF7UP/4YR7uDLrhaWJ/wSSFK7MdmF271BQTkX2RTGVgd3rBFdmubCjxVCxlht0bDHc0W5lHmqr4eJUYiQOXG3mWb3eC/2r1ALR5UI/s3nLd05CBlpm0YGTmLurWoEuclbIURYZZ8VEl/lTMrbgL85z6xrEgmFuaWfwb7dL1j/5mEIsKXzMacH+a75TxGJNzPeMNVByeWFaCLKFlWEtPXZhmVBk7Mq82ZtMeR15NdO5u1yRGVYITUFm2WouXROUE+IASo0EZSwuFnsfMIgDgw/Y44qx5sJ1FCdGLmTX2GIJI6S7mAk22YZSUosjmtJyAz8nD6DniDOgBR3gByZVxLQ4o6laBr3POszdZcD9oLxGbOa7538EauyWiX2B5F1TKVU1XS4QJvy34Lend07JvFXftDnUknjI38BRflBK9rW6ou6RloT7X8FgIXOTfaVuqHrmLkMwmEccJdCxVr+oc8ZkoJKB3Ccs1qo/tMBkRPabB4uI2M+VgZwI/+juwSYx0SkDnZiY7h+MqK6NMtAQRfZCDHYgvkEqZaAivkoOTxpMGfkf7LOcOzoBIISBINqE/6b/Kq0gBJTAC9Zwh5rsziCfsuvn/+24AA5Y4UpiL3H22cM+FNmnNTuMsOMbO/CyKwJ3qcKuodjFHbvqZJfD7jqdDSDYyIYNuS5iwd0cC+pBKhs9u2E9W29gCyFuhSYtHa2+0lFkpaMZNS222OZWAdnypFs3ZQu6bqWZLYG7tXkWNHDRDBZmcfEfF5iqELN4QcxWgZjNhPJcjNEFP11UloWLXRzbBdhd5N+VJLhaCVfE4apLXNmLq8eBhUKugsmVVsGaL1eM5qrkYPkerCuEBY+wEhOWiMLaVVhUK6t9ZRlyvz76AOpIeIIM56qAAAAAAElFTkSuQmCC'
const MOCK_BANK_ACCOUNTS = [
  {
    accountName: 'Checking',
    accountNumberTruncated: '***8052',
    accountType: 'checking',
    id: 2,
    institutionName: 'Chase Bank',
    institutionLogo: MOCK_LOGO_SRC,
  },
  {
    accountName: 'Savings',
    accountNumberTruncated: '********0992',
    accountType: 'savings',
    id: 3,
    institutionName: 'Bank of America',
  },
]

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('src/in-house-liquidity', () => ({
  ...(jest.requireActual('src/in-house-liquidity') as any),
  getFinclusiveBankAccounts: jest.fn(() => Promise.resolve(MOCK_BANK_ACCOUNTS)),
  deleteFinclusiveBankAccount: jest.fn(() => Promise.resolve()),
}))

jest.mock('src/account/openPlaid', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}))

const mockWalletAddress = '0x123'
const store = createMockStore({
  web3: {
    account: mockWalletAddress,
  },
  i18n: {
    language: 'en-US',
  },
  account: {
    e164PhoneNumber: MOCK_PHONE_NUMBER,
  },
})
const mockScreenProps = getMockStackScreenProps(Screens.BankAccounts, {
  newPublicToken: undefined,
})

describe('BankAccounts', () => {
  beforeEach(() => {
    store.dispatch = jest.fn()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('can view and delete bank accounts', async () => {
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <BankAccounts {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => expect(getFinclusiveBankAccounts).toHaveBeenCalled())
    expect(getByText('Chase Bank (***8052)')).toBeTruthy()
    const expectedLogoSourceURI = `data:image/png;base64,${MOCK_LOGO_SRC}`
    expect(getByTestId('BankLogoImg-2').props.source.uri).toEqual(expectedLogoSourceURI)
    expect(getByText('Bank of America (****0992)')).toBeTruthy()
    // When a logo uri is not returned from the server, should show empty image
    expect(getByTestId('BankLogoImg-3').props.source.uri).toEqual('')
    await fireEvent.press(getByTestId('TripleDot2'))
    await fireEvent.press(getByText('bankAccountsScreen.delete'))
    expect(deleteFinclusiveBankAccount).toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(CICOEvents.delete_bank_account, { id: 2 })
  })
  it('shows a loading circle when getFinclusiveBankAccounts is inflight', async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <BankAccounts {...mockScreenProps} />
      </Provider>
    )

    expect(getByTestId('Loader')).toBeTruthy()
    await waitFor(() => expect(getFinclusiveBankAccounts).toHaveBeenCalled())
    await waitFor(() => expect(queryByTestId('Loader')).toBeFalsy())
    await waitFor(() => expect(queryByTestId('AddAccount')).toBeTruthy())
  })
  it('shows an error when delete bank accounts fails', async () => {
    //@ts-ignore . my IDE complains about this, though jest allows it
    deleteFinclusiveBankAccount.mockImplementation(() => Promise.reject())
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <BankAccounts {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => expect(getFinclusiveBankAccounts).toHaveBeenCalled())
    expect(getByText('Chase Bank (***8052)')).toBeTruthy()
    expect(getByText('Bank of America (****0992)')).toBeTruthy()
    await fireEvent.press(getByTestId('TripleDot2'))
    await fireEvent.press(getByText('bankAccountsScreen.delete'))
    expect(deleteFinclusiveBankAccount).toHaveBeenCalled()
    expect(store.dispatch).toHaveBeenLastCalledWith(
      showError(ErrorMessages.DELETE_BANK_ACCOUNT_FAIL)
    )
  })
  it('shows an error when get bank accounts fails', async () => {
    //@ts-ignore . my IDE complains about this, though jest allows it
    getFinclusiveBankAccounts.mockImplementation(() => Promise.reject())
    render(
      <Provider store={store}>
        <BankAccounts {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => expect(getFinclusiveBankAccounts).toHaveBeenCalled())
    expect(store.dispatch).toHaveBeenLastCalledWith(showError(ErrorMessages.GET_BANK_ACCOUNTS_FAIL))
  })
  it('re-fetches bank account info when the newPublicToken navigation prop changes', async () => {
    const { rerender } = render(
      <Provider store={store}>
        <BankAccounts {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => expect(getFinclusiveBankAccounts).toHaveBeenCalledTimes(1))
    // Does not get called with a normal re-render
    rerender(
      <Provider store={store}>
        <BankAccounts {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => expect(getFinclusiveBankAccounts).toHaveBeenCalledTimes(1))
    // Gets called with a rerender where public token changes aka a new account has been added
    rerender(
      <Provider store={store}>
        <BankAccounts
          {...getMockStackScreenProps(Screens.BankAccounts, { newPublicToken: 'foo' })}
        />
      </Provider>
    )
    await waitFor(() => expect(getFinclusiveBankAccounts).toHaveBeenCalledTimes(2))
  })
  it('can add new bank accounts', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <BankAccounts {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => expect(getFinclusiveBankAccounts).toHaveBeenCalled())
    await fireEvent.press(getByTestId('AddAccount'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(CICOEvents.add_bank_account_start)

    expect(openPlaid).toHaveBeenCalledWith({
      walletAddress: mockWalletAddress,
      locale: 'en-US',
      phoneNumber: MOCK_PHONE_NUMBER,
      onSuccess: expect.any(Function),
      onExit: expect.any(Function),
    })
  })
  it('navigation header is set to a custom header and navigate to settings screen', async () => {
    let headerBackButton: React.ReactNode
    ;(mockNavigation.setOptions as jest.Mock).mockImplementation((options) => {
      headerBackButton = options.headerLeft()
    })

    render(
      <Provider store={store}>
        <BankAccounts {...mockScreenProps} />
      </Provider>
    )
    expect(mockNavigation.setOptions).toHaveBeenCalled()

    const { getByTestId } = render(<Provider store={store}>{headerBackButton}</Provider>)
    await fireEvent.press(getByTestId('backButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.Settings)
  })
})
