import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { openLink } from 'react-native-plaid-link-sdk'
import { Provider } from 'react-redux'
import PlaidLinkButton from 'src/account/PlaidLinkButton'
import { createMockStore } from 'test/utils'
import { mockAccount, mockAccount2, mockPrivateDEK } from 'test/values'
import { createLinkToken } from 'src/in-house-liquidity'

jest.mock('react-native-plaid-link-sdk', () => ({
  openLink: jest.fn(),
}))
const mockSuccessResponse = new Response(JSON.stringify({ linkToken: 'foo' }), { status: 200 })
const mockFailResponse = new Response(null, { status: 404 })

jest.mock('src/in-house-liquidity', () => ({
  createLinkToken: jest.fn(({ accountMTWAddress }) => {
    if (accountMTWAddress === 'bad-account') {
      return mockFailResponse
    }
    return mockSuccessResponse
  }),
}))

const MOCK_PHONE_NUMBER = '+18487623478'

describe('PlaidLinkButton', () => {
  const store = createMockStore({
    web3: {
      mtwAddress: mockAccount,
      account: mockAccount2,
      dataEncryptionKey: mockPrivateDEK,
    },
    i18n: {
      language: 'en-US',
    },
    account: {
      e164PhoneNumber: MOCK_PHONE_NUMBER,
    },
  })

  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <PlaidLinkButton disabled={false} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('calls IHL and openLink when pressed', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <PlaidLinkButton disabled={false} />
      </Provider>
    )
    expect(getByTestId('PlaidLinkButton')).toBeEnabled()

    fireEvent.press(getByTestId('PlaidLinkButton'))
    await waitFor(() =>
      expect(createLinkToken).toHaveBeenCalledWith({
        accountMTWAddress: mockAccount,
        isAndroid: true,
        language: 'en',
        phoneNumber: MOCK_PHONE_NUMBER,
        dekPrivate: mockPrivateDEK,
      })
    )

    expect(openLink).toHaveBeenCalledWith({
      tokenConfig: {
        token: 'foo',
      },
      onExit: expect.anything(),
      onSuccess: expect.anything(),
    })
  })

  it('does not call openLink if IHL returns an error', async () => {
    const store = createMockStore({
      web3: {
        mtwAddress: 'bad-account',
        account: mockAccount2,
        dataEncryptionKey: mockPrivateDEK,
      },
      i18n: {
        language: 'en-US',
      },
      account: {
        e164PhoneNumber: MOCK_PHONE_NUMBER,
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <PlaidLinkButton disabled={false} />
      </Provider>
    )
    expect(getByTestId('PlaidLinkButton')).toBeEnabled()

    fireEvent.press(getByTestId('PlaidLinkButton'))
    await waitFor(() => expect(createLinkToken).toHaveBeenCalled())
    expect(openLink).not.toHaveBeenCalled()
  })
})
