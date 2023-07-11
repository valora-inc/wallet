import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import HooksPreviewModeBanner from 'src/positions/HooksPreviewModeBanner'
import { previewModeDisabled } from 'src/positions/slice'
import { createMockStore } from 'test/utils'

describe(HooksPreviewModeBanner, () => {
  it('should render when hooks preview is enabled', () => {
    const tree = render(
      <Provider
        store={createMockStore({
          positions: {
            previewApiUrl: 'https://example.com',
          },
        })}
      >
        <HooksPreviewModeBanner />)
      </Provider>
    )

    expect(tree.getByText('hooksPreview.bannerTitle')).toBeTruthy()
  })

  it("shouldn't render when hooks preview is disabled", () => {
    const tree = render(
      <Provider
        store={createMockStore({
          positions: {
            previewApiUrl: null,
          },
        })}
      >
        <HooksPreviewModeBanner />)
      </Provider>
    )

    expect(tree.queryByText('hooksPreview.bannerTitle')).toBeFalsy()
  })

  it('should disable hooks preview when tapped', () => {
    const store = createMockStore({
      positions: {
        previewApiUrl: 'https://example.com',
      },
    })
    const tree = render(
      <Provider store={store}>
        <HooksPreviewModeBanner />)
      </Provider>
    )

    fireEvent.press(tree.getByText('hooksPreview.bannerTitle'))
    expect(store.getActions()).toEqual([previewModeDisabled()])
  })
})
