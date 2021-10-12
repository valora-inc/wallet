import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import VerificationInputScreen from 'src/verify/VerificationInputScreen'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

// TODO: Add better tests for this
describe('VerificationInputScreen', () => {
  const store = createMockStore({})

  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <VerificationInputScreen {...getMockStackScreenProps(Screens.VerificationInputScreen)} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
