import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { QrScreenEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import QrScanButton from 'src/components/QrScanButton'
import { navigate } from 'src/navigator/NavigationService'
import { QRTabs, Screens } from 'src/navigator/Screens'

jest.mock('src/analytics/ValoraAnalytics')

describe('HeaderButtons', () => {
  it('navigates to QR scanner and emits analytics event on press', () => {
    const { queryByTestId, getByTestId } = render(<QrScanButton testID="QrScanButton" />)
    expect(queryByTestId('QrScanButton')).toBeTruthy()
    fireEvent.press(getByTestId('QrScanButton'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(QrScreenEvents.qr_scanner_open)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, { tab: QRTabs.QRScanner })
  })
})
