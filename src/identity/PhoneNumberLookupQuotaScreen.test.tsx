import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import PhoneNumberLookupQuotaScreen from 'src/identity/PhoneNumberLookupQuotaScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockTokenBalances } from 'test/values'

const mockScreenProps = getMockStackScreenProps(Screens.PhoneNumberLookupQuota, {
  onBuy: jest.fn(),
  onSkip: jest.fn(),
})

describe('PhoneNumberLookupQuotaScreen', () => {
  const store = createMockStore({
    tokens: {
      tokenBalances: mockTokenBalances,
    },
  })

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <PhoneNumberLookupQuotaScreen {...mockScreenProps} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
