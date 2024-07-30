import { generateOnRampURL } from '@coinbase/cbpay-js'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import { CoinbasePayEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import {
  CoinbasePaymentSection,
  CoinbasePaymentSectionProps,
} from 'src/fiatExchanges/CoinbasePaymentSection'
import { PaymentMethod } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeloTokenId,
  mockEthTokenId,
  mockProviderSelectionAnalyticsData,
  mockProviders,
  mockTokenBalances,
} from 'test/values'

const FAKE_APP_ID = 'fake app id'
const FAKE_URL = 'www.coinbasepay.test'

jest.mock('src/analytics/AppAnalytics')

jest.mock('@coinbase/cbpay-js', () => ({
  generateOnRampURL: jest.fn(),
}))

describe('CoinbasePaymentSection', () => {
  let props: CoinbasePaymentSectionProps
  let mockStore: MockStoreEnhanced
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    props = {
      cryptoAmount: 10,
      coinbaseProvider: mockProviders.find((quote) =>
        quote.paymentMethods.includes(PaymentMethod.Coinbase)
      )!,
      appId: FAKE_APP_ID,
      analyticsData: mockProviderSelectionAnalyticsData,
      tokenId: mockCeloTokenId,
    }
    mockStore = createMockStore({
      tokens: {
        tokenBalances: mockTokenBalances,
      },
    })
  })

  it.each([
    {
      tokenId: mockCeloTokenId,
      supportedNetworks: ['celo'],
      assets: ['CGLD'],
    },
    {
      tokenId: mockEthTokenId,
      supportedNetworks: ['ethereum'],
      assets: ['ETH'],
    },
  ])(
    'calls generateOnRampURL with correct params for $tokenId',
    async ({ tokenId, supportedNetworks, assets }) => {
      jest.mocked(generateOnRampURL).mockReturnValue(FAKE_URL)
      render(
        <Provider store={mockStore}>
          <CoinbasePaymentSection {...props} tokenId={tokenId} />
        </Provider>
      )
      expect(generateOnRampURL).toHaveBeenCalledWith({
        appId: FAKE_APP_ID,
        destinationWallets: [
          {
            address: mockAccount.toLowerCase(),
            supportedNetworks,
            assets,
          },
        ],
        presetCryptoAmount: 10,
      })
    }
  )

  it('navigates to coinbase flow when card is pressed', async () => {
    jest.mocked(generateOnRampURL).mockReturnValue(FAKE_URL)
    const { getByTestId, queryByText } = render(
      <Provider store={mockStore}>
        <CoinbasePaymentSection {...props} />
      </Provider>
    )
    expect(generateOnRampURL).toHaveBeenCalledWith({
      appId: FAKE_APP_ID,
      destinationWallets: [
        {
          address: mockAccount.toLowerCase(),
          supportedNetworks: ['celo'],
          assets: ['CGLD'],
        },
      ],
      presetCryptoAmount: 10,
    })
    await waitFor(() => expect(queryByText('Coinbase Pay')).toBeTruthy())
    fireEvent.press(getByTestId('coinbasePayCard'))
    await waitFor(() => {
      expect(AppAnalytics.track).toBeCalledWith(
        CoinbasePayEvents.coinbase_pay_flow_start,
        mockProviderSelectionAnalyticsData
      )
      expect(navigate).toBeCalled()
    })
  })
})
