import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Platform } from 'react-native'
import { Provider } from 'react-redux'
import { getDynamicConfigParams } from 'src/statsig'
import WebViewScreen from 'src/webview/WebViewScreen'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

const dappUri = 'https://somedapp.url'

describe('WebViewScreen', () => {
  beforeEach(() => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      disabledMediaPlaybackRequiresUserActionOrigins: [],
    })
  })

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
    expect(getByTestId('RNWebView').props.mediaPlaybackRequiresUserAction).toBe(true)
    expect(getByTestId('WebViewScreen/Refresh')).toBeTruthy()
    expect(getByTestId('WebViewScreen/GoBack')).toBeDisabled()
    expect(getByTestId('WebViewScreen/GoForward')).toBeDisabled()
    expect(getByTestId('WebViewScreen/OpenBottomSheet')).toBeTruthy()
    expect(getByTestId('WebViewScreen/KeyboardAwareView')).toBeTruthy()
  })

  it('should set the mediaPlaybackRequiresUserAction prop according to the url', () => {
    const uri = 'https://somedapp.url'
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      disabledMediaPlaybackRequiresUserActionOrigins: [uri],
    })

    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator
          component={WebViewScreen}
          params={{
            uri,
          }}
        />
      </Provider>
    )

    expect(getByTestId('RNWebView').props.mediaPlaybackRequiresUserAction).toBe(false)
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
