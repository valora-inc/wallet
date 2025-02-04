import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { QrScreenEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import QrScanButton from 'src/components/QrScanButton'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

jest.mock('src/analytics/AppAnalytics')

describe('HeaderButtons', () => {
  it('navigates to QR scanner and emits analytics event on press', () => {
    const { queryByTestId, getByTestId } = render(<QrScanButton testID="QrScanButton" />)
    expect(queryByTestId('QrScanButton')).toBeTruthy()
    fireEvent.press(getByTestId('QrScanButton'))
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(QrScreenEvents.qr_scanner_open)
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.QRNavigator, { screen: Screens.QRScanner })
  })
})
