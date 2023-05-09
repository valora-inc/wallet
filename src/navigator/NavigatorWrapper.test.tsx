import dynamicLinks from '@react-native-firebase/dynamic-links'
import { render, waitFor } from '@testing-library/react-native'
import CleverTap from 'clevertap-react-native'
import * as React from 'react'
import { Linking } from 'react-native'
import { Provider } from 'react-redux'
import { pastForcedBackupDeadlineSelector } from 'src/backup/selectors'
import { navigate } from 'src/navigator/NavigationService'
import NavigatorWrapper from 'src/navigator/NavigatorWrapper'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams } from 'src/statsig'
import { createMockStore } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/statsig')
jest.mock('src/backup/selectors')
jest.mock('src/navigator/NavigationService', () => ({
  ...(jest.requireActual('src/navigator/NavigationService') as any),
  navigatorIsReadyRef: { current: false },
  navigate: jest.fn(),
}))
jest.mock('src/sentry/Sentry', () => ({
  ...(jest.requireActual('src/sentry/Sentry') as any),
  sentryRoutingInstrumentation: { registerNavigationContainer: jest.fn() },
}))

const mockDynamicLinksOnLink = jest.fn().mockReturnValue(jest.fn())
const mockDynamicLinksGetInitialLink = jest.fn()
jest.mock('@react-native-firebase/dynamic-links', () => () => ({
  onLink: mockDynamicLinksOnLink,
  getInitialLink: mockDynamicLinksGetInitialLink,
}))
jest.mock('clevertap-react-native', () => ({
  getInitialUrl: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
}))

describe('NavigatorWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderNavigatorWrapper() {
    const store = createMockStore()
    render(
      <Provider store={store}>
        <NavigatorWrapper />
      </Provider>
    )
  }

  it('initializes the deep links handlers', async () => {
    renderNavigatorWrapper()

    await waitFor(() => expect(CleverTap.addListener).toHaveBeenCalled())
    expect(Linking.addEventListener).toHaveBeenCalled()
    expect(dynamicLinks().onLink).toHaveBeenCalled()
    expect(CleverTap.getInitialUrl).toHaveBeenCalled()
    expect(Linking.getInitialURL).toHaveBeenCalled()
    expect(dynamicLinks().getInitialLink).toHaveBeenCalled()
  })

  it('forces backup when deadline in past and enableForcedBackup is true', () => {
    mocked(getExperimentParams).mockReturnValue({ enableForcedBackup: true })
    mocked(pastForcedBackupDeadlineSelector).mockReturnValue(true)

    renderNavigatorWrapper()
    expect(navigate).toHaveBeenCalledWith(Screens.BackupForceScreen)
  })

  it('does not force backup when enableForcedBackup is false', () => {
    mocked(getExperimentParams).mockReturnValue({ enableForcedBackup: false })
    mocked(pastForcedBackupDeadlineSelector).mockReturnValue(true)

    renderNavigatorWrapper()
    expect(navigate).not.toHaveBeenCalledWith(Screens.BackupForceScreen)
  })

  it('does not force backup when deadline in future', () => {
    mocked(getExperimentParams).mockReturnValue({ enableForcedBackup: true })
    mocked(pastForcedBackupDeadlineSelector).mockReturnValue(false)

    renderNavigatorWrapper()
    expect(navigate).not.toHaveBeenCalledWith(Screens.BackupForceScreen)
  })
})
