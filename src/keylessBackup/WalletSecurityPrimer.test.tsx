import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import WalletSecurityPrimer from 'src/keylessBackup/WalletSecurityPrimer'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

describe('WalletSecurityPrimer', () => {
  it('pressing get started button emits analytics event, dispatches keylessBackupStarted, and navigates to next screen', () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <WalletSecurityPrimer {...getMockStackScreenProps(Screens.WalletSecurityPrimer)} />
      </Provider>
    )
    const continueButton = getByTestId('WalletSecurityPrimer/GetStarted')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.wallet_security_primer_get_started
    )
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.KeylessBackupIntro, {
      keylessBackupFlow: KeylessBackupFlow.Setup,
    })
  })
})
