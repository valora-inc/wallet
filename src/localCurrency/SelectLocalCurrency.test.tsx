import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { LOCAL_CURRENCY_CODES } from 'src/localCurrency/consts'
import SelectLocalCurrency from 'src/localCurrency/SelectLocalCurrency'
import { createMockStore } from 'test/utils'

describe('SelectLocalCurrency', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Provider store={createMockStore()}>
        <SelectLocalCurrency />
      </Provider>
    )
    for (const code of LOCAL_CURRENCY_CODES) {
      expect(getByText(code)).toBeTruthy()
    }
  })
})
