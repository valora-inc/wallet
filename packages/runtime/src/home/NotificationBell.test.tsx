import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import NotificationBell from 'src/home/NotificationBell'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/AppAnalytics')

const testId = 'NotificationBell'

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it(`emits the analytics event on press when there is no new notification`, () => {
    const storeDataWithoutNotification = {
      account: {
        backupCompleted: true,
        dismissedGetVerified: true,
        celoEducationCompleted: true,
      },
    }

    const { getByTestId } = render(
      <Provider store={createMockStore(storeDataWithoutNotification)}>
        <NotificationBell testID={testId} />
      </Provider>
    )

    expect(getByTestId(testId)).toBeTruthy()
    fireEvent.press(getByTestId(testId))
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_bell_pressed, {
      hasNotifications: false,
    })
  })

  it(`emits the analytics event on press when there are notifications`, () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({})}>
        <NotificationBell testID={testId} />
      </Provider>
    )

    expect(getByTestId(testId)).toBeTruthy()
    fireEvent.press(getByTestId(testId))
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_bell_pressed, {
      hasNotifications: true,
    })
  })
})
