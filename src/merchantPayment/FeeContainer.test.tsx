import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import FeeContainer from 'src/merchantPayment/FeeContainer'
import { createMockStore } from 'test/utils'

describe('FeeContainer', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <FeeContainer amount={new BigNumber(1337)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
