import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { CeloGoldOverview } from 'src/exchange/CeloGoldOverview'
import { createMockStore, getMockI18nProps } from 'test/utils'

const SAMPLE_BALANCE = '55.00001'

it('renders correctly when ready', () => {
  const tree = renderer.create(
    <Provider
      store={createMockStore({
        goldToken: { balance: SAMPLE_BALANCE },
        localCurrency: { celoExchangeRate: '10' },
      })}
    >
      <CeloGoldOverview testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly when not ready', () => {
  const tree = renderer.create(
    <Provider
      store={createMockStore({
        goldToken: { balance: SAMPLE_BALANCE },
        localCurrency: { celoExchangeRate: null },
      })}
    >
      <CeloGoldOverview testID={'SnapshotCeloGoldOverview'} {...getMockI18nProps()} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
