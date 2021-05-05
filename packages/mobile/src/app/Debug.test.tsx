import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import Debug from 'src/app/Debug'
import { createMockStore } from 'test/utils'

describe('Debug', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore()}>
        <Debug />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
