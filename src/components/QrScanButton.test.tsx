import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import QrScanButton from 'src/components/QrScanButton'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { QrScreenEvents } from 'src/analytics/Events'
import { Screens } from 'src/navigator/Screens'
import { CloseIcon } from 'src/navigator/types'

jest.mock('src/analytics/ValoraAnalytics')

describe('HeaderButtons', () => {
  it('navigates to QR scanner and emits analytics event on press', () => {
    const { queryByTestId, getByTestId } = render(<QrScanButton testID="QrScanButton" />)
    expect(queryByTestId('QrScanButton')).toBeTruthy()
    fireEvent.press(getByTestId('QrScanButton'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(QrScreenEvents.qr_scanner_open)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, {
      screen: Screens.QRScanner,
      closeIcon: CloseIcon.BackChevron,
    })
  })
})
