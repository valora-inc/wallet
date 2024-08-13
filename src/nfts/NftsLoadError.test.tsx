import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { NftEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import NftLoadError from 'src/nfts/NftsLoadError'

jest.mock('src/analytics/AppAnalytics')

describe('NftsLoadErrorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByTestId, getByText } = render(<NftLoadError />)

    expect(getByTestId('RedLoadingSpinnerToInfo')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.loadErrorTitle')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.loadErrorSubtitle')).toBeTruthy()
    expect(getByText('nftsLoadErrorScreen.contactSupport')).toBeTruthy()
  })

  it('should be able to navigate to contact support', () => {
    const { getByTestId } = render(<NftLoadError />)

    fireEvent.press(getByTestId('NftsLoadErrorScreen/ContactSupport'))
    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
  })

  it('sends correct analytics event on screen load', () => {
    render(<NftLoadError />)
    expect(AppAnalytics.track).toHaveBeenCalledWith(NftEvents.nft_error_screen_open)
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
  })
})
