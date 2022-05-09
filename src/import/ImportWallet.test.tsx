import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import mockButton from 'src/components/Button'
import { Actions } from 'src/import/actions'
import ImportWallet from 'src/import/ImportWallet'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockMnemonic } from 'test/values'

jest.mock('src/geth/GethAwareButton', () => {
  return mockButton
})

const mockScreenProps = getMockStackScreenProps(Screens.ImportWallet, { clean: true })

describe('ImportWallet', () => {
  it('renders correctly and is disabled with no text', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <ImportWallet {...mockScreenProps} />
      </Provider>
    )

    expect(wrapper.toJSON()).toMatchSnapshot()
    expect(wrapper.UNSAFE_getAllByProps({ disabled: true }).length).toBeGreaterThan(0)
  })

  it('calls import with the mnemonic', () => {
    const store = createMockStore()

    const wrapper = render(
      <Provider store={store}>
        <ImportWallet {...mockScreenProps} />
      </Provider>
    )

    fireEvent(wrapper.getByTestId('ImportWalletBackupKeyInputField'), 'inputChange', mockMnemonic)
    fireEvent.press(wrapper.getByTestId('ImportWalletButton'))

    const allActions = store.getActions()
    const importAction = allActions.filter((action) => action.type === Actions.IMPORT_BACKUP_PHRASE)
    // expecting importBackupPhrases function to be called once
    expect(importAction.length).toBe(1)
  })
})
