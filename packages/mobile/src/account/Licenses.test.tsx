import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import Licenses from 'src/account/Licenses'
import { createMockStore } from 'test/utils'

describe('Licenses', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <Licenses />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
