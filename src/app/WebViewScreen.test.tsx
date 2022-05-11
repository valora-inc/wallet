import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import WebViewScreen from 'src/app/WebViewScreen'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

const dappUri = 'https://somedapp.url'

describe('WebViewScreen', () => {
  it('should render the correct components', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator
          component={WebViewScreen}
          params={{
            uri: dappUri,
          }}
        />
      </Provider>
    )

    expect(getByText('close')).toBeTruthy()
    expect(getByTestId('RNWebView').props.source.uri).toEqual(dappUri)
    expect(getByTestId('WebViewScreen/Refresh')).toBeTruthy()
    expect(getByTestId('WebViewScreen/GoBack')).toBeDisabled()
    expect(getByTestId('WebViewScreen/GoForward')).toBeDisabled()
  })
})
