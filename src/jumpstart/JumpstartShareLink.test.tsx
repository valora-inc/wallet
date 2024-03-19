import Clipboard from '@react-native-clipboard/clipboard'
import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
import React from 'react'
import { Share } from 'react-native'
import { Provider } from 'react-redux'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import JumpstartShareLink from 'src/jumpstart/JumpstartShareLink'
import { navigateHome } from 'src/navigator/NavigationService'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCusdTokenId } from 'test/values'

describe('JumpstartShareLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderJumpstartShareLink() {
    return render(
      <Provider store={createMockStore()}>
        <MockedNavigator
          component={JumpstartShareLink}
          params={{
            tokenId: mockCusdTokenId,
            sendAmount: '12.345',
            link: 'https://some.link',
          }}
        />
      </Provider>
    )
  }
  const expectedTrackedProperties = {
    tokenId: mockCusdTokenId,
    networkId: 'celo-alfajores',
    amountInUsd: '12.345',
  }

  it('should render the correct information', () => {
    const { getByText, getByTestId, queryByText } = renderJumpstartShareLink()

    expect(getByText('jumpstartShareLinkScreen.title')).toBeTruthy()
    expect(getByText('jumpstartShareLinkScreen.description, {"tokenSymbol":"cUSD"}')).toBeTruthy()
    expect(getByTestId('JumpstartShareLink/LiveLink')).toHaveTextContent('https://some.link')
    expect(
      within(getByTestId('JumpstartShareLink/ScrollView')).getByText(
        'jumpstartShareLinkScreen.ctaShare'
      )
    ).toBeEnabled()
    expect(queryByText('jumpstartShareLinkScreen.navigationWarning.title')).toBeFalsy()
  })

  it('should copy the link on press copy', async () => {
    const { getByTestId } = renderJumpstartShareLink()

    fireEvent.press(getByTestId('JumpstartShareLink/LiveLink/Copy'))

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_copy_link, {
      ...expectedTrackedProperties,
      origin: 'mainScreen',
    })
    expect(Clipboard.setString).toHaveBeenCalledWith('https://some.link')
  })

  it('should call the native share on press share', async () => {
    const mockShare = jest.spyOn(Share, 'share')
    const { getByTestId } = renderJumpstartShareLink()

    fireEvent.press(
      within(getByTestId('JumpstartShareLink/ScrollView')).getByText(
        'jumpstartShareLinkScreen.ctaShare'
      )
    )

    await waitFor(() =>
      expect(mockShare).toHaveBeenCalledWith({
        message:
          'jumpstartShareLinkScreen.shareMessage, {"link":"https://some.link","tokenAmount":"12.345","tokenSymbol":"cUSD"}',
      })
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_share_link, {
      ...expectedTrackedProperties,
      origin: 'mainScreen',
    })
  })

  it('should track the outcome of the share', async () => {
    jest.spyOn(Share, 'share').mockResolvedValueOnce({
      action: 'sharedAction',
    })
    jest.spyOn(Share, 'share').mockRejectedValueOnce(new Error('shareError'))
    const { getByTestId } = renderJumpstartShareLink()

    fireEvent.press(
      within(getByTestId('JumpstartShareLink/ScrollView')).getByText(
        'jumpstartShareLinkScreen.ctaShare'
      )
    )
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        JumpstartEvents.jumpstart_share_link_result,
        {
          ...expectedTrackedProperties,
          action: 'sharedAction',
        }
      )
    )

    fireEvent.press(
      within(getByTestId('JumpstartShareLink/ScrollView')).getByText(
        'jumpstartShareLinkScreen.ctaShare'
      )
    )
    await waitFor(() =>
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        JumpstartEvents.jumpstart_share_link_result,
        {
          ...expectedTrackedProperties,
          error: 'shareError',
        }
      )
    )
  })

  it('should open the QR share bottom sheet on press share QR', async () => {
    const mockShare = jest.spyOn(Share, 'share')
    const { getByText, getByTestId } = renderJumpstartShareLink()

    fireEvent.press(getByText('jumpstartShareLinkScreen.ctaScanQRCode'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_show_QR,
      expectedTrackedProperties
    )

    fireEvent.press(getByTestId('JumpstartShareLink/QRCodeBottomSheet/LiveLink/Copy'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_copy_link, {
      ...expectedTrackedProperties,
      origin: 'qrScreen',
    })

    fireEvent.press(
      within(getByTestId('JumpstartShareLink/QRCodeBottomSheet')).getByText(
        'jumpstartShareLinkScreen.ctaShare'
      )
    )

    await waitFor(() =>
      expect(mockShare).toHaveBeenCalledWith({
        message:
          'jumpstartShareLinkScreen.shareMessage, {"link":"https://some.link","tokenAmount":"12.345","tokenSymbol":"cUSD"}',
      })
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_share_link, {
      ...expectedTrackedProperties,
      origin: 'qrScreen',
    })
  })

  it('should warn the user before navigating away', async () => {
    const { getByText, getByTestId, queryByText } = renderJumpstartShareLink()

    fireEvent.press(getByTestId('JumpstartShareLink/CloseButton'))
    // warning should be shown
    await waitFor(() =>
      expect(getByText('jumpstartShareLinkScreen.navigationWarning.title')).toBeTruthy()
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_share_close)

    // should not navigate away if the user taps on the primary action
    fireEvent.press(
      within(getByTestId('JumpstartShareLink/ConfirmNavigationDialog')).getByText(
        'jumpstartShareLinkScreen.ctaShare'
      )
    )
    await waitFor(() =>
      expect(queryByText('jumpstartShareLinkScreen.navigationWarning.title')).toBeFalsy()
    )
    expect(navigateHome).not.toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_share_dismiss_close
    )

    fireEvent.press(getByTestId('JumpstartShareLink/CloseButton'))
    // should navigate away if the user taps on the secondary action
    fireEvent.press(getByText('jumpstartShareLinkScreen.navigationWarning.ctaNavigate'))
    await waitFor(() => expect(navigateHome).toHaveBeenCalled())
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_share_confirm_close
    )
  })
})
