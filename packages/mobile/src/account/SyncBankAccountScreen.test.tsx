import { render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import SyncBankAccountScreen from 'src/account/SyncBankAccountScreen'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockPrivateDEK } from 'test/values'
import { createFinclusiveBankAccount, exchangePlaidAccessToken } from 'src/in-house-liquidity'
import { Screens } from 'src/navigator/Screens'
import { navigate } from 'src/navigator/NavigationService'

const mockPublicToken = 'foo'
const mockAccessToken = 'bar'

const mockPlaidAccessTokenResponse = new Response(
  JSON.stringify({ accessToken: mockAccessToken }),
  { status: 200 }
)
const mockPlaidAccessTokenResponseError = new Response(
  JSON.stringify({ accessToken: mockAccessToken }),
  { status: 400 }
)

const mockFinclusiveBankAccountResponse = new Response(JSON.stringify({}), { status: 200 })
const mockFinclusiveBankAccountResponseError = new Response(JSON.stringify({}), { status: 400 })

const mockProps = getMockStackScreenProps(Screens.SyncBankAccountScreen, {
  publicToken: mockPublicToken,
})

jest.mock('src/in-house-liquidity', () => ({
  createFinclusiveBankAccount: jest.fn(() => mockFinclusiveBankAccountResponse),
  exchangePlaidAccessToken: jest.fn(() => mockPlaidAccessTokenResponse),
}))

jest.mock('src/navigator/NavigationService', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
  navigate: jest.fn(),
}))

describe('SyncBankAccountScreen', () => {
  const store = createMockStore({
    web3: {
      mtwAddress: mockAccount,
      dataEncryptionKey: mockPrivateDEK,
    },
  })

  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('calls createFinclusiveBankAccount and exchangePlaidAccessToken', async () => {
    const { toJSON } = render(
      <Provider store={store}>
        <SyncBankAccountScreen {...mockProps} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
    await waitFor(() => {
      expect(exchangePlaidAccessToken).toHaveBeenCalledWith({
        accountMTWAddress: mockAccount,
        publicToken: mockPublicToken,
        dekPrivate: mockPrivateDEK,
      })
      expect(createFinclusiveBankAccount).toHaveBeenCalledWith({
        accountMTWAddress: mockAccount,
        plaidAccessToken: mockAccessToken,
        dekPrivate: mockPrivateDEK,
      })
    })
  })

  it('directs to error page when token exchange fails', async () => {
    exchangePlaidAccessToken.mockResolvedValue(mockPlaidAccessTokenResponseError)

    render(
      <Provider store={store}>
        <SyncBankAccountScreen {...mockProps} />
      </Provider>
    )
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(Screens.LinkBankAccountErrorScreen)
    })
  })

  it('directs to error page when create finclusive bank account fails', async () => {
    createFinclusiveBankAccount.mockResolvedValue(mockFinclusiveBankAccountResponseError)

    render(
      <Provider store={store}>
        <SyncBankAccountScreen {...mockProps} />
      </Provider>
    )
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith(Screens.LinkBankAccountErrorScreen)
    })
  })
})
