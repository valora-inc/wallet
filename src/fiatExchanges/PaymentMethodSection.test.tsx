import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import {
  PaymentMethodSection,
  PaymentMethodSectionProps,
} from 'src/fiatExchanges/PaymentMethodSection'
import { CICOFlow, getQuotes, PaymentMethod } from 'src/fiatExchanges/utils'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { createMockStore } from 'test/utils'
import { mockProviders } from 'test/values'

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
      cicoQuotes: getQuotes(mockProviders),
      setNoPaymentMethods: jest.fn(),
      flow: CICOFlow.CashIn,
    }
  })
  it('shows nothing if there are no available providers', async () => {
    props.cicoQuotes = []
    const { queryByText } = render(
      <Provider store={mockStore}>
        <PaymentMethodSection {...props} />
      </Provider>
    )

    expect(queryByText('selectProviderScreen.bank')).toBeFalsy()
    expect(queryByText('selectProviderScreen.card')).toBeFalsy()
  })
  it('shows a non-expandable view if there is one provider available', async () => {
    props.cicoQuotes = getQuotes([mockProviders[2]])
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
})
