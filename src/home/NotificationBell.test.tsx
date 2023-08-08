import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import NotificationBell from 'src/home/NotificationBell'
import { createMockStore } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')

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
        dismissedStartSupercharging: true,
      },
    }

    const { getByTestId } = render(
      <Provider store={createMockStore(storeDataWithoutNotification)}>
        <NotificationBell testID={testId} />
      </Provider>
    )

    expect(getByTestId(testId)).toBeTruthy()
    fireEvent.press(getByTestId(testId))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_bell_pressed, {
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
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_bell_pressed, {
      hasNotifications: true,
    })
  })
})
