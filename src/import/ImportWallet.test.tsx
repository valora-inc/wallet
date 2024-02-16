import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { cancelCreateOrRestoreAccount } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Actions } from 'src/import/actions'
import ImportWallet from 'src/import/ImportWallet'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockMnemonic } from 'test/values'

const mockScreenProps = { clean: true }

describe('ImportWallet', () => {
  it('renders correctly and is disabled with no text', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <MockedNavigator component={ImportWallet} params={mockScreenProps} />
      </Provider>
    )

    expect(wrapper.getByTestId('HeaderTitle')).toHaveTextContent('importExistingKey.header')
    expect(wrapper.queryByTestId('HeaderSubTitle')).toBeFalsy()
    expect(wrapper.getByTestId('ImportWalletBackupKeyInputField')).toHaveTextContent('')
    expect(wrapper.getByTestId('ImportWalletButton')).toBeDisabled()
  })

  it('calls import with the mnemonic', () => {
    const store = createMockStore()

    const wrapper = render(
      <Provider store={store}>
        <MockedNavigator component={ImportWallet} params={mockScreenProps} />
      </Provider>
    )

    fireEvent(wrapper.getByTestId('ImportWalletBackupKeyInputField'), 'inputChange', mockMnemonic)
    fireEvent.press(wrapper.getByTestId('ImportWalletButton'))

    const allActions = store.getActions()
    const importAction = allActions.filter((action) => action.type === Actions.IMPORT_BACKUP_PHRASE)
    // expecting importBackupPhrases function to be called once
    expect(importAction.length).toBe(1)
  })

  it('navigates to the welcome screen on cancel', () => {
    const store = createMockStore()
    const wrapper = render(
      <Provider store={store}>
        <MockedNavigator component={ImportWallet} params={mockScreenProps} />
      </Provider>
    )

    fireEvent.press(wrapper.getByText('cancel'))

    expect(navigateClearingStack).toHaveBeenCalledWith(Screens.Welcome)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.restore_account_cancel)
    expect(store.getActions()).toEqual([cancelCreateOrRestoreAccount()])
  })
})
