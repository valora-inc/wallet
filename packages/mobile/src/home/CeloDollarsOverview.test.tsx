import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import CeloDollarsOverview from 'src/home/CeloDollarsOverview'
import { createMockStore } from 'test/utils'

describe('CeloDollarsOverview', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <CeloDollarsOverview />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
