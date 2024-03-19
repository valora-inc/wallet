import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
import React from 'react'
import { Share } from 'react-native'
import { Provider } from 'react-redux'
import JumpstartShareLink from 'src/jumpstart/JumpstartShareLink'
import { navigateHome } from 'src/navigator/NavigationService'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockCusdTokenId } from 'test/values'

describe('JumpstartShareLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the correct information', () => {
    const { getByText, getByTestId, queryByText } = render(
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

    expect(getByText('jumpstartShareLinkScreen.title')).toBeTruthy()
    expect(getByText('jumpstartShareLinkScreen.description, {"tokenSymbol":"cUSD"}')).toBeTruthy()
    expect(getByTestId('JumpstartShareLink/LiveLink')).toHaveTextContent('https://some.link')
    expect(getByText('jumpstartShareLinkScreen.ctaShare')).toBeEnabled()
    expect(queryByText('jumpstartShareLinkScreen.navigationWarning.title')).toBeFalsy()
  })

  it('should call the native share on press share', async () => {
    const mockShare = jest.spyOn(Share, 'share')
    const { getByText } = render(
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

    fireEvent.press(getByText('jumpstartShareLinkScreen.ctaShare'))

    await waitFor(() =>
      expect(mockShare).toHaveBeenCalledWith({
        message:
          'jumpstartShareLinkScreen.shareMessage, {"link":"https://some.link","tokenAmount":"12.345","tokenSymbol":"cUSD"}',
      })
    )
  })

  it('should warn the user before navigating away', async () => {
    const { getByText, getByTestId, queryByText } = render(
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

    fireEvent.press(getByTestId('JumpstartShareLink/CloseButton'))
    // warning should be shown
    await waitFor(() =>
      expect(getByText('jumpstartShareLinkScreen.navigationWarning.title')).toBeTruthy()
    )

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

    fireEvent.press(getByTestId('JumpstartShareLink/CloseButton'))
    // should navigate away if the user taps on the secondary action
    fireEvent.press(getByText('jumpstartShareLinkScreen.navigationWarning.ctaNavigate'))

    await waitFor(() => expect(navigateHome).toHaveBeenCalled())
  })
})
