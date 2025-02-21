import { act, renderHook } from '@testing-library/react-native'
import React from 'react'
import { Linking } from 'react-native'
import { Provider } from 'react-redux'
import { useDeepLinks } from 'src/app/useDeepLinks'
import { createMockStore } from 'test/utils'

describe('useDeepLinks', () => {
  let linkingListenerCallback: Function

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(Linking.addEventListener).mockImplementation((event, callback) => {
      if (event === 'url') {
        linkingListenerCallback = callback
      }
      return {
        remove: jest.fn(),
      } as any
    })
  })

  it('should handle linking events with deep links', async () => {
    const store = createMockStore()
    renderHook(() => useDeepLinks(), {
      wrapper: (component) => (
        <Provider store={store}>{component?.children ? component.children : component}</Provider>
      ),
    })

    await act(() => {
      linkingListenerCallback({ url: 'some-link' })
    })

    expect(store.getActions()).toEqual([
      {
        deepLink: 'some-link',
        isSecureOrigin: false,
        type: 'APP/OPEN_DEEP_LINK',
      },
    ])
  })
})
