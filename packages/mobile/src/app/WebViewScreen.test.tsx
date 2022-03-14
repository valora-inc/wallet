import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import WebViewScreen from 'src/app/WebViewScreen'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

const dappName = 'some dapp name'
const dappHostName = 'somedapp.url'
const dappUri = `https://${dappHostName}`

describe('WebViewScreen', () => {
  it('should render the correct components', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator
          component={WebViewScreen}
          params={{
            uri: dappUri,
            headerTitle: dappName,
          }}
        />
      </Provider>
    )

    expect(getByText('close')).toBeTruthy()
    expect(getByText(dappName)).toBeTruthy()
    expect(getByText(dappHostName)).toBeTruthy()
    expect(getByTestId('RNWebView').props.source.uri).toEqual(dappUri)
    expect(getByTestId('WebViewScreen/Refresh')).toBeTruthy()
    expect(getByTestId('WebViewScreen/GoBack')).toBeDisabled()
    expect(getByTestId('WebViewScreen/GoForward')).toBeDisabled()
  })
})
