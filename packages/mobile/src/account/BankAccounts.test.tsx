import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockPrivateDEK } from 'test/values'
import BankAccounts from './BankAccounts'
import { deleteFinclusiveBankAccount, getFinclusiveBankAccounts } from 'src/in-house-liquidity'
import openPlaid from 'src/account/openPlaid'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'

const MOCK_PHONE_NUMBER = '+18487623478'
const MOCK_BANK_ACCOUNTS = [
  {
    accountName: 'Checking',
    accountNumberTruncated: '***8052',
    accountType: 'checking',
    id: 2,
  },
  {
    accountName: 'Savings',
    accountNumberTruncated: '********0992',
    accountType: 'savings',
    id: 3,
  },
]

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

const store = createMockStore({
  web3: {
    mtwAddress: mockAccount,
    dataEncryptionKey: mockPrivateDEK,
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
    expect(getByText('Checking (***8052)'))
    expect(getByText('Savings (****0992)'))
    await fireEvent.press(getByTestId('TripleDot2'))
    await fireEvent.press(getByText('bankAccountsScreen.delete'))
    expect(deleteFinclusiveBankAccount).toHaveBeenCalled()
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
    expect(getByText('Checking (***8052)'))
    expect(getByText('Savings (****0992)'))
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
    expect(openPlaid).toHaveBeenCalledWith({
      accountMTWAddress: mockAccount,
      locale: 'en-US',
      phoneNumber: MOCK_PHONE_NUMBER,
      dekPrivate: mockPrivateDEK,
      onSuccess: expect.any(Function),
      onExit: expect.any(Function),
    })
  })
})
