import { getExperimentParams } from 'src/statsig'
import { mocked } from 'ts-jest/utils'
import { pastForcedBackupDeadlineSelector } from 'src/backup/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import NavigatorWrapper from 'src/navigator/NavigatorWrapper'
import { createMockStore } from 'test/utils'
import { Provider } from 'react-redux'

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
