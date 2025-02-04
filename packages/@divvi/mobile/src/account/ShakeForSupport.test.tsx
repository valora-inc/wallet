import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import ShakeForSupport from 'src/account/ShakeForSupport'
import { AppState } from 'src/app/actions'
import { createMockStore } from 'test/utils'

const createStore = (appState: AppState) =>
  createMockStore({
    app: { appState },
  })

describe('ShakeForSupport', () => {
  it('does not render when App not active', async () => {
    const tree = render(
      <Provider store={createStore(AppState.Background)}>
        <ShakeForSupport />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
