import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import {
  PaymentMethodSection,
  PaymentMethodSectionProps,
} from 'src/fiatExchanges/PaymentMethodSection'
import { normalizeQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { createMockStore } from 'test/utils'
import {
  mockFiatConnectQuotes,
  mockFiatConnectQuotesWithUnknownFees,
  mockProviders,
} from 'test/values'

const mockStore = createMockStore({
  localCurrency: {
    preferredCurrencyCode: LocalCurrencyCode.USD,
  },
})

describe('PaymentMethodSection', () => {
  let props: PaymentMethodSectionProps
  beforeEach(() => {
    props = {
      paymentMethod: PaymentMethod.Card,
      normalizedQuotes: normalizeQuotes(CICOFlow.CashIn, [], mockProviders),
      setNoPaymentMethods: jest.fn(),
      flow: CICOFlow.CashIn,
    }
  })
  it('shows nothing if there are no available providers', async () => {
    props.normalizedQuotes = []
    const { queryByText } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )

    expect(queryByText('selectProviderScreen.bank')).toBeFalsy()
    expect(queryByText('selectProviderScreen.card')).toBeFalsy()
  })
  it('shows a non-expandable view if there is one provider available', async () => {
    props.normalizedQuotes = normalizeQuotes(CICOFlow.CashIn, [], [mockProviders[2]])
    const { queryByText, queryByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByTestId(`image-Ramp`)).toBeTruthy()
  })
  it('shows an expandable view if there is more than one provider available', async () => {
    const { queryByText, queryByTestId, getByText } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )

    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByText('selectProviderScreen.numProviders, {"count":3}')).toBeTruthy()
    expect(queryByTestId(`image-Ramp`)).toBeFalsy()

    // Expand works
    fireEvent.press(getByText('selectProviderScreen.numProviders, {"count":3}'))
    expect(queryByTestId(`image-Ramp`)).toBeTruthy()
  })

  it('shows "Fees Vary" when a provider does not return fees in its quote', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      mockFiatConnectQuotesWithUnknownFees,
      []
    )
    props.paymentMethod = PaymentMethod.Bank
    const { queryByText, queryByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    const expandElement = queryByText('selectProviderScreen.numProviders, {"count":2}')
    expect(expandElement).toBeTruthy()
    fireEvent.press(expandElement!)
    expect(queryByTestId('Bank/fee-1')).toHaveTextContent('selectProviderScreen.feesVary')
  })

  it('shows "ID required" when KYC is required', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [mockFiatConnectQuotes[3]] as FiatConnectQuoteSuccess[],
      []
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
      'selectProviderScreen.idRequired | selectProviderScreen.numDays'
    )
  })

  it('shows no ID requirement when KYC not required', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [mockFiatConnectQuotes[1]] as FiatConnectQuoteSuccess[],
      []
    )
    props.paymentMethod = PaymentMethod.Bank
    const { queryByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    const infoElement = queryByTestId('Bank/provider-0/info')
    expect(infoElement).toBeTruthy()
    expect(infoElement).toHaveTextContent('selectProviderScreen.numDays')
    expect(infoElement).not.toHaveTextContent('selectProviderScreen.idRequired')
  })

  it.each([
    [
      PaymentMethod.Card as const,
      normalizeQuotes(CICOFlow.CashIn, [], [mockProviders[2]]),
      'card',
      'oneHour',
    ],
    [
      PaymentMethod.Bank as const,
      normalizeQuotes(CICOFlow.CashIn, [mockFiatConnectQuotes[1]] as FiatConnectQuoteSuccess[], []),
      'bank',
      'numDays',
    ],
    // TODO(any): enable as part of ACT-518. Doesn't work currently since FC
    // quotes can't be created for mobile money
    // [
    //   PaymentMethod.FiatConnectMobileMoney as const,
    //   normalizeQuotes(CICOFlow.CashIn, [mockFiatConnectQuotes[4]] as FiatConnectQuoteSuccess[], []),
    //   'mobileMoney',
    //   'oneDay',
    // ],
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
