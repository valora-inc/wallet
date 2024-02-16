import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import {
  PaymentMethodSection,
  PaymentMethodSectionProps,
} from 'src/fiatExchanges/PaymentMethodSection'
import { normalizeQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockCusdAddress,
  mockCusdTokenId,
  mockFiatConnectQuotes,
  mockProviderSelectionAnalyticsData,
  mockProviders,
} from 'test/values'

const mockStore = createMockStore({
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.USD,
  },
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        priceUsd: '1',
        balance: '10',
        priceFetchedAt: Date.now(),
        isFeeCurrency: true,
      },
    },
  },
})

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
}))

describe('PaymentMethodSection', () => {
  let props: PaymentMethodSectionProps
  beforeEach(() => {
    props = {
      paymentMethod: PaymentMethod.Card,
      // the below creates 4 quotes - 1 Ramp (card), 2 Moonpay (bank, card), 1 Simplex (card)
      normalizedQuotes: normalizeQuotes(
        CICOFlow.CashIn,
        [],
        mockProviders,
        mockCusdTokenId,
        'cUSD'
      ),
      flow: CICOFlow.CashIn,
      tokenId: mockCusdTokenId,
      analyticsData: mockProviderSelectionAnalyticsData,
    }
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })
  it('shows nothing if there are no available providers', async () => {
    props.normalizedQuotes = []
    const { queryByText, queryByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )

    expect(queryByText('selectProviderScreen.bank')).toBeFalsy()
    expect(queryByText('selectProviderScreen.card')).toBeFalsy()
    expect(queryByTestId('newDialog')).toBeFalsy()
  })

  it('shows a non-expandable view with receive amount if there is one provider available', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [],
      [mockProviders[2]],
      mockCusdTokenId,
      'cUSD'
    )
    const { queryByText, queryByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByTestId('image-Ramp')).toBeTruthy()
    expect(queryByTestId('newLabel-Ramp')).toBeFalsy()
    expect(queryByTestId('Card/provider-0')).toHaveTextContent(
      'selectProviderScreen.receiveAmount100.00 cUSD'
    )
  })

  it('shows new info dialog in non expandable section', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [],
      [mockProviders[2]],
      mockCusdTokenId,
      'cUSD'
    )
    jest.spyOn(props.normalizedQuotes[0], 'isProviderNew').mockReturnValue(true)
    const { getByText, getByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    expect(getByText('selectProviderScreen.card')).toBeTruthy()
    expect(getByTestId('image-Ramp')).toBeTruthy()
    expect(getByTestId('newLabel-Ramp')).toBeTruthy()
    expect(getByTestId('newDialog')).toBeTruthy()
    expect(getByTestId('newDialog')).not.toBeVisible()

    fireEvent.press(getByTestId('newLabel-Ramp'))
    expect(getByTestId('newDialog')).toBeVisible()
    fireEvent.press(getByTestId('newDialog/PrimaryAction'))
    await waitFor(() => expect(getByTestId('newDialog')).not.toBeVisible())
  })

  it('shows new label for multiple providers in expanded view', async () => {
    // make simplex and moonpay card quotes new
    jest.spyOn(props.normalizedQuotes[3], 'isProviderNew').mockReturnValue(true)
    jest.spyOn(props.normalizedQuotes[4], 'isProviderNew').mockReturnValue(true)

    const { queryByText, queryByTestId, getByText, getByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )

    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByText('selectProviderScreen.numProviders, {"count":3}')).toBeTruthy()

    expect(queryByTestId('image-Ramp')).toBeTruthy()
    expect(queryByTestId('image-Simplex')).toBeTruthy()
    expect(queryByTestId('image-Moonpay')).toBeTruthy()
    expect(queryByTestId('newLabel-Ramp')).toBeFalsy()
    expect(queryByTestId('newLabel-Simplex')).toBeTruthy()
    expect(queryByTestId('newLabel-Moonpay')).toBeTruthy()

    expect(getByTestId('newDialog')).not.toBeVisible()
    fireEvent.press(getByTestId('newLabel-Simplex'))
    expect(getByTestId('newDialog')).toBeVisible()
    fireEvent.press(getByTestId('newDialog/PrimaryAction'))
    await waitFor(() => expect(getByTestId('newDialog')).not.toBeVisible())
    fireEvent.press(getByTestId('newLabel-Moonpay'))
    expect(getByTestId('newDialog')).toBeVisible()

    // Collapse works
    fireEvent.press(getByText('selectProviderScreen.numProviders, {"count":3}'))
    expect(queryByTestId('image-Ramp')).toBeFalsy()
    expect(queryByTestId('image-Simplex')).toBeFalsy()
    expect(queryByTestId('image-Moonpay')).toBeFalsy()
  })

  it('shows "ID required" when KYC is required', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [mockFiatConnectQuotes[3]] as FiatConnectQuoteSuccess[],
      [],
      mockCusdTokenId,
      'cUSD'
    )
    props.paymentMethod = PaymentMethod.Bank
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    const infoElement = queryByTestId('Bank/provider-0/info')
    expect(infoElement).toBeTruthy()
    expect(infoElement).toHaveTextContent(
      'selectProviderScreen.idRequired | selectProviderScreen.xToYDays, {"lowerBound":1,"upperBound":3}'
    )
  })

  it('shows no ID requirement when KYC not required', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [mockFiatConnectQuotes[1]] as FiatConnectQuoteSuccess[],
      [],
      mockCusdTokenId,
      'cUSD'
    )
    props.paymentMethod = PaymentMethod.Bank
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    const infoElement = queryByTestId('Bank/provider-0/info')
    expect(infoElement).toBeTruthy()
    expect(infoElement).toHaveTextContent(
      'selectProviderScreen.xToYHours, {"lowerBound":1,"upperBound":2}'
    )
    expect(infoElement).not.toHaveTextContent('selectProviderScreen.idRequired')
  })

  it.each([
    [
      PaymentMethod.Card as const,
      normalizeQuotes(CICOFlow.CashIn, [], [mockProviders[2]], mockCusdTokenId, 'cUSD'),
      'card',
      'oneHour',
    ],
    [
      PaymentMethod.Bank as const,
      normalizeQuotes(
        CICOFlow.CashIn,
        [mockFiatConnectQuotes[1]] as FiatConnectQuoteSuccess[],
        [],
        mockCusdTokenId,
        'cUSD'
      ),
      'bank',
      'xToYHours',
    ],
    [
      PaymentMethod.FiatConnectMobileMoney as const,
      normalizeQuotes(
        CICOFlow.CashIn,
        [mockFiatConnectQuotes[4]] as FiatConnectQuoteSuccess[],
        [],
        mockCusdTokenId,
        'cUSD'
      ),
      'mobileMoney',
      'xHours',
    ],
  ])('shows appropriate title and settlement time for %s', (paymentMethod, quotes, title, info) => {
    props.normalizedQuotes = quotes
    props.paymentMethod = paymentMethod
    const { getByText, getByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    expect(getByText(`selectProviderScreen.${title}`)).toBeTruthy()
    expect(getByTestId(`${paymentMethod}/provider-0/info`)).toHaveTextContent(
      `selectProviderScreen.${info}`
    )
  })
})
