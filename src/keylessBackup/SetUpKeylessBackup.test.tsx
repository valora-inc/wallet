import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import SetUpKeylessBackup from 'src/keylessBackup/SetUpKeylessBackup'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'

describe('SetUpKeylessBackup', () => {
  it('pressing continue button emits analytics event', () => {
    const { getByTestId } = render(<SetUpKeylessBackup />)
    const continueButton = getByTestId('SetUpKeylessBackup/Continue')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('set_up_keyless_backup_screen_continue')
  })
})
