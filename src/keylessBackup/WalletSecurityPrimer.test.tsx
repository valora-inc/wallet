import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import WalletSecurityPrimer from 'src/keylessBackup/WalletSecurityPrimer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getMockStackScreenProps } from 'test/utils'

describe('WalletSecurityPrimer', () => {
  it('renders drawer if prop is set', () => {
    const { getByTestId } = render(
      <WalletSecurityPrimer
        {...getMockStackScreenProps(Screens.WalletSecurityPrimerDrawer, { showDrawerTopBar: true })}
      />
    )
    expect(getByTestId('WalletSecurityPrimer/DrawerTopBar')).toBeTruthy()
  })

  it('hides drawer if prop is not set', () => {
    const { queryByTestId } = render(
      <WalletSecurityPrimer {...getMockStackScreenProps(Screens.WalletSecurityPrimer)} />
    )
    expect(queryByTestId('WalletSecurityPrimer/DrawerTopBar')).toBeFalsy()
  })

  it('pressing get started button emits analytics event and navigates to next screen', () => {
    const { getByTestId } = render(
      <WalletSecurityPrimer {...getMockStackScreenProps(Screens.WalletSecurityPrimer)} />
    )
    const continueButton = getByTestId('WalletSecurityPrimer/GetStarted')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.wallet_security_primer_get_started
    )
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.SetUpKeylessBackup)
  })
})
