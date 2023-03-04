import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { DappCategory } from 'src/dapps/types'
import DAppsExplorerScreen from 'src/dappsExplorer/DappsExplorerScreen'
import { createMockStore } from 'test/utils'
import { mockDappListV1, mockDappListV2 } from 'test/values'

const dappsCategories: DappCategory[] = [
  {
    id: '1',
    name: 'Swap',
    backgroundColor: '#DEF8EA',
    fontColor: '#1AB775',
  },
  {
    id: '2',
    name: 'Lend, Borrow & Earn',
    backgroundColor: '#DEF8F7',
    fontColor: '#07A0AE',
  },
]

describe(DAppsExplorerScreen, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should show DAppsExplorerScreenLegacy by default', () => {
    const dappsList = mockDappListV1
    const store = createMockStore({
      dapps: { dappListApiUrl: 'http://url.com', dappsList, dappsCategories },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <DAppsExplorerScreen />
      </Provider>
    )

    expect(getByTestId('DAppsExplorerScreenLegacy')).toBeTruthy()
  })

  it('should show DAppsExplorerScreenFilter when dappFilterEnabled is true', () => {
    const dappsList = mockDappListV2
    const store = createMockStore({
      dapps: {
        dappListApiUrl: 'http://url.com',
        dappsList,
        dappsCategories,
        dappsFilterEnabled: true,
      },
    })

    const { getByTestId } = render(
      <Provider store={store}>
        <DAppsExplorerScreen />
      </Provider>
    )

    expect(getByTestId('DAppsExplorerScreenFilter')).toBeTruthy()
  })
})
