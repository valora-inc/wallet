import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import AlertBanner from 'src/alert/AlertBanner'
import { ErrorDisplayType } from 'src/alert/reducer'
import { createMockStore } from 'test/utils'

describe('AlertBanner', () => {
  describe('when message passed in', () => {
    it('renders message', () => {
      const { toJSON } = render(
        <Provider
          store={createMockStore({
            alert: {
              type: 'message',
              displayMethod: ErrorDisplayType.BANNER,
              message: 'This is your shadow speaking',
              dismissAfter: 0,
            },
          })}
        >
          <AlertBanner />
        </Provider>
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  describe('when message and title passed in', () => {
    it('renders title with message', () => {
      const { toJSON } = render(
        <Provider
          store={createMockStore({
            alert: {
              type: 'message',
              displayMethod: ErrorDisplayType.BANNER,
              title: 'Declaration',
              message: 'This is your shadow speaking',
              dismissAfter: 0,
            },
          })}
        >
          <AlertBanner />
        </Provider>
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  describe('when error message passed in', () => {
    it('renders error message', () => {
      const { toJSON } = render(
        <Provider
          store={createMockStore({
            alert: {
              type: 'error',
              displayMethod: ErrorDisplayType.BANNER,
              message: 'This is an error',
              dismissAfter: 0,
            },
          })}
        >
          <AlertBanner />
        </Provider>
      )
      expect(toJSON()).toMatchSnapshot()
    })
  })

  describe('when an action is provided', () => {
    it('dispatches the action when pressed', () => {
      const store = createMockStore({
        alert: {
          type: 'message',
          displayMethod: ErrorDisplayType.BANNER,
          message: 'My message',
          dismissAfter: 0,
          action: { type: 'MY_ACTION' },
        },
      })
      const { toJSON, getByTestId } = render(
        <Provider store={store}>
          <AlertBanner />
        </Provider>
      )
      expect(toJSON()).toMatchSnapshot()

      fireEvent.press(getByTestId('SmartTopAlertTouchable'))
      expect(store.getActions()).toEqual([{ type: 'MY_ACTION' }])
    })
  })
})
