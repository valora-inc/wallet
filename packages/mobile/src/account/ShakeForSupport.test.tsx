import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import ShakeForSupport from 'src/account/ShakeForSupport'
import { AppState } from 'src/app/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

const createStore = (appState: AppState) =>
  createMockStore({
    app: { appState },
  })

describe('ShakeForSupport', () => {
  // beforeEach(() => jest.useRealTimers())

  it('does not render when App not active', async () => {
    const tree = render(
      <Provider store={createStore(AppState.Background)}>
        <ShakeForSupport />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when App is active', async () => {
    const tree = render(
      <Provider store={createStore(AppState.Active)}>
        <ShakeForSupport />
      </Provider>
    )
    expect(tree.queryByTestId('ContactSupportFromShake')).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('navigates to support screen after button press', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(AppState.Active)}>
        <ShakeForSupport />
      </Provider>
    )
    fireEvent.press(getByTestId('ContactSupportFromShake'))
    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
  })
})
