import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Platform } from 'react-native'
import { Provider } from 'react-redux'
import { navigateToURI } from 'src/utils/linking'
import { WebViewAndroidBottomSheet } from 'src/webview/WebViewAndroidBottomSheet'
import { createMockStore } from 'test/utils'

describe('WebViewAndroidBottomSheet', () => {
  beforeEach(() => {
    Platform.OS = 'android'
  })

  it('renders correctly when visible', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <WebViewAndroidBottomSheet
          currentUrl="https://example.com"
          isVisible={true}
          onClose={jest.fn()}
          toggleBottomSheet={jest.fn()}
        />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when not visible', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <WebViewAndroidBottomSheet
          currentUrl="https://example.com"
          isVisible={false}
          onClose={jest.fn()}
          toggleBottomSheet={jest.fn()}
        />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('navigates to the correct url', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({})}>
        <WebViewAndroidBottomSheet
          currentUrl="https://example.com"
          isVisible={true}
          onClose={jest.fn()}
          toggleBottomSheet={jest.fn()}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('OpenInExternalBrowser'))
    expect(navigateToURI).toHaveBeenCalledWith('https://example.com')
  })
})
