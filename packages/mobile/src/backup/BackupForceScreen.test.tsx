import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import BackupForceScreen from 'src/backup/BackupForceScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.BackupForceScreen)

describe('BackupForceScreen', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={createMockStore()}>
        <BackupForceScreen {...mockScreenProps} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
