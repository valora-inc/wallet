import * as React from 'react'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { error, idle } from 'src/verify/module'
import VerificationLoadingScreen from 'src/verify/VerificationLoadingScreen'
import { createMockStore } from 'test/utils'

// Lock time so snapshots always show the same countdown value
jest.spyOn(Date, 'now').mockImplementation(() => 1487076708000)

describe('VerificationLoadingScreen', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider
        store={createMockStore({
          verify: {
            currentState: idle(),
            attestationCodes: [],
          },
        })}
      >
        <VerificationLoadingScreen />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly with fail modal', () => {
    const store = createMockStore({
      verify: {
        currentState: error('test'),
        attestationCodes: [],
      },
    })
    const { toJSON } = render(
      <Provider store={store}>
        <VerificationLoadingScreen />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
