import { fireEvent, render, within } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { AlertTypes } from 'src/alert/actions'
import AlertBanner from 'src/alert/AlertBanner'
import { ErrorDisplayType } from 'src/alert/reducer'
import { createMockStore } from 'test/utils'

describe('AlertBanner', () => {
  describe('when message passed in', () => {
    it('renders message', () => {
      const { getByTestId } = render(
        <Provider
          store={createMockStore({
            alert: {
              type: AlertTypes.MESSAGE,
              displayMethod: ErrorDisplayType.BANNER,
              message: 'This is your shadow speaking',
              dismissAfter: 0,
            },
          })}
        >
          <AlertBanner />
        </Provider>
      )
      expect(
        within(getByTestId('infoBanner')).getByText('This is your shadow speaking')
      ).toBeTruthy()
    })
  })

  describe('when message and title passed in', () => {
    it('renders title with message', () => {
      const { getByTestId } = render(
        <Provider
          store={createMockStore({
            alert: {
              type: AlertTypes.MESSAGE,
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
      const banner = getByTestId('infoBanner')

      expect(banner).toHaveTextContent('Declaration')
      expect(banner).toHaveTextContent('This is your shadow speaking')
    })
  })

  describe('when error message passed in', () => {
    it('renders error message', () => {
      const { getByTestId } = render(
        <Provider
          store={createMockStore({
            alert: {
              type: AlertTypes.ERROR,
              displayMethod: ErrorDisplayType.BANNER,
              message: 'This is an error',
              dismissAfter: 0,
            },
          })}
        >
          <AlertBanner />
        </Provider>
      )

      expect(within(getByTestId('errorBanner')).getByText('This is an error')).toBeTruthy()
    })
  })

  describe('when an action is provided', () => {
    it('dispatches the action when pressed', () => {
      const store = createMockStore({
        alert: {
          type: AlertTypes.MESSAGE,
          displayMethod: ErrorDisplayType.BANNER,
          message: 'My message',
          dismissAfter: 0,
          action: { type: 'MY_ACTION' },
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <AlertBanner />
        </Provider>
      )

      fireEvent.press(getByTestId('SmartTopAlertTouchable'))
      expect(store.getActions()).toEqual([{ type: 'MY_ACTION' }])
    })
  })

  describe('bottom toast with action alert', () => {
    it('displays and dispatches the action', () => {
      const store = createMockStore({
        alert: {
          type: AlertTypes.TOAST,
          displayMethod: ErrorDisplayType.BANNER,
          message: 'My precious toast',
          buttonMessage: 'Some button label',
          action: { type: 'MY_ACTION' },
        },
      })
      const { getByText, queryByTestId } = render(
        <Provider store={store}>
          <AlertBanner />
        </Provider>
      )

      expect(getByText('My precious toast')).toBeTruthy()
      expect(queryByTestId('SmartTopAlertTouchable')).toBeFalsy()

      fireEvent.press(getByText('Some button label'))
      expect(store.getActions()).toEqual([{ type: 'MY_ACTION' }])
    })
  })
})
