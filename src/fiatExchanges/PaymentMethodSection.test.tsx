import { fireEvent, render, waitFor } from '@testing-library/react-native'
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
import { CiCoCurrency } from 'src/utils/currencies'

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
      // the below creates 4 quotes - 1 Ramp (card), 2 Moonpay (bank, card), 1 Simplex (card)
      normalizedQuotes: normalizeQuotes(CICOFlow.CashIn, [], mockProviders, CiCoCurrency.CUSD),
      setNoPaymentMethods: jest.fn(),
      flow: CICOFlow.CashIn,
    }
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

  it('shows a non-expandable view if there is one provider available', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [],
      [mockProviders[2]],
      CiCoCurrency.CUSD
    )
    const { queryByText, queryByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )
    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByTestId('image-Ramp')).toBeTruthy()
    expect(queryByTestId('newLabel-Ramp')).toBeFalsy()
  })

  it('shows new info dialog in non expandable section', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      [],
      [mockProviders[2]],
      CiCoCurrency.CUSD
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

  it('shows an expandable view if there is more than one provider available', async () => {
    const { queryByText, queryByTestId, getByText } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )

    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByText('selectProviderScreen.numProviders, {"count":3}')).toBeTruthy()
    expect(queryByTestId('image-Ramp')).toBeFalsy()
    expect(queryByTestId('image-Simplex')).toBeFalsy()
    expect(queryByTestId('image-Moonpay')).toBeFalsy()

    // Expand works
    fireEvent.press(getByText('selectProviderScreen.numProviders, {"count":3}'))
    expect(queryByTestId('image-Ramp')).toBeTruthy()
    expect(queryByTestId('image-Simplex')).toBeTruthy()
    expect(queryByTestId('image-Moonpay')).toBeTruthy()
    expect(queryByTestId('newLabel-Ramp')).toBeFalsy()
    expect(queryByTestId('newLabel-Simplex')).toBeFalsy()
    expect(queryByTestId('newLabel-Moonpay')).toBeFalsy()
  })

  it('shows new label for multiple providers in expanded view', async () => {
    // make simplex and moonpay card quotes new
    jest.spyOn(props.normalizedQuotes[2], 'isProviderNew').mockReturnValue(true)
    jest.spyOn(props.normalizedQuotes[3], 'isProviderNew').mockReturnValue(true)

    const { queryByText, queryByTestId, getByText, getByTestId } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )

    expect(queryByText('selectProviderScreen.card')).toBeTruthy()
    expect(queryByText('selectProviderScreen.numProviders, {"count":3}')).toBeTruthy()
    expect(queryByTestId('image-Ramp')).toBeFalsy()
    expect(queryByTestId('image-Simplex')).toBeFalsy()
    expect(queryByTestId('image-Moonpay')).toBeFalsy()

    // Expand works
    fireEvent.press(getByText('selectProviderScreen.numProviders, {"count":3}'))
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
  })

  it('shows "Fees Vary" when a provider does not return fees in its quote', async () => {
    props.normalizedQuotes = normalizeQuotes(
      CICOFlow.CashIn,
      mockFiatConnectQuotesWithUnknownFees,
      [],
      CiCoCurrency.CUSD
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
      [],
      CiCoCurrency.CUSD
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
      [],
      CiCoCurrency.CUSD
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
      normalizeQuotes(CICOFlow.CashIn, [], [mockProviders[2]], CiCoCurrency.CUSD),
      'card',
      'oneHour',
    ],
    [
      PaymentMethod.Bank as const,
      normalizeQuotes(
        CICOFlow.CashIn,
        [mockFiatConnectQuotes[1]] as FiatConnectQuoteSuccess[],
        [],
        CiCoCurrency.CUSD
      ),
      'bank',
      'numDays',
    ],
    [
      PaymentMethod.FiatConnectMobileMoney as const,
      normalizeQuotes(
        CICOFlow.CashIn,
        [mockFiatConnectQuotes[4]] as FiatConnectQuoteSuccess[],
        [],
        CiCoCurrency.CUSD
      ),
      'mobileMoney',
      'lessThan24Hours',
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
