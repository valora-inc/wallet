import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Platform } from 'react-native'
import { Provider } from 'react-redux'
import WebViewScreen from 'src/webview/WebViewScreen'
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
    expect(getByTestId('WebViewScreen/OpenBottomSheet')).toBeTruthy()
  })

  describe('Android bottom sheet', () => {
    beforeEach(() => {
      Platform.OS = 'android'
    })

    it('should render android bottom sheet when triple dot icon tapped', async () => {
      const { getByTestId } = render(
        <Provider store={createMockStore()}>
          <MockedNavigator
            component={WebViewScreen}
            params={{
              uri: dappUri,
            }}
          />
        </Provider>
      )

      fireEvent.press(getByTestId('WebViewScreen/OpenBottomSheet'))
      expect(getByTestId('WebViewAndroidBottomSheet')).toBeTruthy()
    })
  })
})
