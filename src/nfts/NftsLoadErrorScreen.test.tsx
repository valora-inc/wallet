import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftsLoadErrorScreen from 'src/nfts/NftsLoadErrorScreen'

describe('NftsLoadErrorScreen', () => {
  it('renders correctly', () => {
    const { getByTestId, getByText } = render(<NftsLoadErrorScreen />)

    expect(getByTestId('NftsLoadErrorScreen/Icon')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.loadErrorTitle')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.loadErrorSubtitle')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.contactSupport')).toBeTruthy()
  })

  it('should be able to navigate back', () => {
    const { getByTestId } = render(<NftsLoadErrorScreen />)

    fireEvent.press(getByTestId('NftsLoadErrorScreen/BackButton'))
    expect(navigateBack).toHaveBeenCalled()
  })

  it('should be able to navigate to contact support', () => {
    const { getByTestId } = render(<NftsLoadErrorScreen />)

    fireEvent.press(getByTestId('NftsLoadErrorScreen/ContactSupport'))
    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
  })
})
