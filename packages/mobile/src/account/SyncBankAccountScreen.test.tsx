import { render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import SyncBankAccountScreen from 'src/account/SyncBankAccountScreen'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockPrivateDEK } from 'test/values'
import { createFinclusiveBankAccount, exchangePlaidAccessToken } from 'src/in-house-liquidity'
import { Screens } from 'src/navigator/Screens'

const mockPublicToken = 'foo'
const mockAccessToken = 'bar'

const mockProps = getMockStackScreenProps(Screens.SyncBankAccountScreen, {
  publicToken: mockPublicToken,
})

jest.mock('src/in-house-liquidity', () => ({
  createFinclusiveBankAccount: jest.fn(() => Promise.resolve()),
  exchangePlaidAccessToken: jest.fn(() => Promise.resolve(mockAccessToken)),
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
})
