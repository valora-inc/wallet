import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackupComplete from 'src/backup/BackupComplete'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('BackupComplete', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })
  it('renders correctly', () => {
    const tree = render(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true },
        })}
      >
        <BackupComplete {...getMockStackScreenProps(Screens.BackupComplete)} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to settings on account removal', () => {
    render(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true },
        })}
      >
        <BackupComplete
          {...getMockStackScreenProps(Screens.BackupComplete, { isAccountRemoval: true })}
        />
      </Provider>
    )
    jest.advanceTimersByTime(2000)
    expect(navigate).toHaveBeenCalledWith(Screens.Settings, { promptConfirmRemovalModal: true })
  })

  it('navigates home and fires analytics event when not on account removal', () => {
    render(
      <Provider
        store={createMockStore({
          account: { backupCompleted: true },
        })}
      >
        <BackupComplete {...getMockStackScreenProps(Screens.BackupComplete)} />
      </Provider>
    )
    jest.advanceTimersByTime(2000)
    expect(navigateHome).toHaveBeenCalledWith()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('backup_complete')
  })
})
