import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { CeloGoldOverview } from 'src/exchange/CeloGoldOverview'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockI18nProps } from 'test/utils'

const SAMPLE_BALANCE = '55.00001'

it('renders correctly when ready', () => {
  const tree = render(
    <Provider
      store={createMockStore({
        goldToken: { balance: SAMPLE_BALANCE },
        localCurrency: { exchangeRates: { [Currency.Celo]: '10' } },
      })}
    >
      <CeloGoldOverview testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly when not ready', () => {
  const tree = render(
    <Provider
      store={createMockStore({
        goldToken: { balance: SAMPLE_BALANCE },
        localCurrency: { exchangeRates: { [Currency.Dollar]: null } },
      })}
    >
      <CeloGoldOverview testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
