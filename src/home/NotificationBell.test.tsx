import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import NotificationBell from 'src/home/NotificationBell'

const mockUseNotifications = jest.fn()

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('src/home/NotificationBox', () => ({
  useNotifications: () => mockUseNotifications(),
}))

const testId = 'NotificationBell'

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it(`emits the analytics event on press when there is no new notification`, () => {
    mockUseNotifications.mockReturnValue([])
    const { queryByTestId, getByTestId } = render(<NotificationBell testID={testId} />)
    expect(queryByTestId(testId)).toBeTruthy()
    fireEvent.press(getByTestId(testId))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_bell_pressed, {
      hasNewNotifications: false,
    })
  })

  it(`emits the analytics event on press when there are new notifications`, () => {
    const mockNotification = jest.fn()
    mockUseNotifications.mockReturnValue([mockNotification])
    const { queryByTestId, getByTestId } = render(<NotificationBell testID={testId} />)
    expect(queryByTestId(testId)).toBeTruthy()
    fireEvent.press(getByTestId(testId))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(HomeEvents.notification_bell_pressed, {
      hasNewNotifications: true,
    })
  })
})
