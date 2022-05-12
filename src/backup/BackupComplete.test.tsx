import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import BackupComplete from 'src/backup/BackupComplete'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('BackupComplete', () => {
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
})
