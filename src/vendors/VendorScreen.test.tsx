import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { RootState } from 'src/redux/reducers'
import { createMockStore, RecursivePartial } from 'test/utils'
import VendorScreen from './VendorsScreen'

describe('VendorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderScreen(overrideState: RecursivePartial<RootState>) {
    const store = createMockStore({
      ...overrideState,
    })

    const tree = render(
      <Provider store={store}>
        <VendorScreen />
      </Provider>
    )

    return { store, tree, ...tree }
  }

  it("renders correctly on user's first visit", async () => {
    const { getByTestId, queryAllByTestId } = renderScreen({})
    expect(getByTestId('Vendors/List')).toBeTruthy()
    expect(queryAllByTestId('Vendors/VendorItem').length).toBeGreaterThan(0)
    // expect(getByTestId('Vendors/DetailSheet')).toHaveProp('isVisible', false);
  })
})
