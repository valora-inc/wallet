import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import Debug from 'src/app/Debug'
import { createMockStore } from 'test/utils'

jest.mock('statsig-react-native', () => ({
  Statsig: {
    getStableID: () => 'stableId',
  },
}))

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
