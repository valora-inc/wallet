import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import Persona from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { createMockStore } from 'test/utils'

const personaProps = {
  kycStatus: KycStatus.Created,
}

describe('Persona', () => {
  const store = createMockStore({})
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
