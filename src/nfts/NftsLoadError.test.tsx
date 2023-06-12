import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftLoadError from 'src/nfts/NftsLoadError'

describe('NftsLoadErrorScreen', () => {
  it('renders correctly', () => {
    const { getByTestId, getByText } = render(<NftLoadError />)

    expect(getByTestId('NftsLoadErrorScreen/Icon')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.loadErrorTitle')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.loadErrorSubtitle')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.contactSupport')).toBeTruthy()
  })

  it('should be able to navigate to contact support', () => {
    const { getByTestId } = render(<NftLoadError />)

    fireEvent.press(getByTestId('NftsLoadErrorScreen/ContactSupport'))
    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
  })
})
