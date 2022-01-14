import { render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import SyncBankAccountScreen from 'src/account/SyncBankAccountScreen'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockAccount2 } from 'test/values'
import { createFinclusiveBankAccount, exchangePlaidAccessToken } from 'src/in-house-liquidity'
import { Screens } from 'src/navigator/Screens'

const mockPublicToken = 'foo'
const mockAccessToken = 'bar'
const mockPlaidAccessTokenResponse = new Response(
  JSON.stringify({ accessToken: mockAccessToken }),
  { status: 200 }
)
const mockFinclusiveBankAccountReponse = new Response(JSON.stringify({}), { status: 200 })
const mockProps = getMockStackScreenProps(Screens.SyncBankAccountScreen, {
  publicToken: mockPublicToken,
})

jest.mock('src/in-house-liquidity', () => ({
  createFinclusiveBankAccount: jest.fn(() => mockFinclusiveBankAccountReponse),
  exchangePlaidAccessToken: jest.fn(() => mockPlaidAccessTokenResponse),
}))

describe('SyncBankAccountScreen', () => {
  const store = createMockStore({
    web3: {
      mtwAddress: mockAccount,
      account: mockAccount2,
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
        walletAddress: mockAccount2.toLocaleLowerCase(),
      })
      expect(createFinclusiveBankAccount).toHaveBeenCalledWith({
        accountMTWAddress: mockAccount,
        plaidAccessToken: mockAccessToken,
        walletAddress: mockAccount2.toLocaleLowerCase(),
      })
    })
  })
})
