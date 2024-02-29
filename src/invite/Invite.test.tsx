import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { noop } from 'lodash'
import React from 'react'
import { Share } from 'react-native'
import { Provider } from 'react-redux'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import * as InviteUtils from 'src/firebase/dynamicLinks'
import { createMockStore } from 'test/utils'
import Invite from './Invite'

jest.mock('src/analytics/ValoraAnalytics')
const mockShare = jest.spyOn(Share, 'share')
const mockCreateInviteLink = jest.spyOn(InviteUtils, 'createInviteLink')

const { press } = fireEvent

describe('Invite', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const getWrapper = ({
    inviteRewardsVersion,
    phoneNumberVerified,
  }: { inviteRewardsVersion?: string; phoneNumberVerified?: boolean } = {}) =>
    render(
      <Provider
        store={createMockStore({
          web3: {
            account: '0xabc123',
          },
          send: {
            inviteRewardsVersion,
          },
          app: {
            phoneNumberVerified,
          },
        })}
      >
        <Invite />
      </Provider>
    )

  it('should disable button while loading share URL', () => {
    mockCreateInviteLink.mockReturnValue(new Promise(noop))
    const { getByTestId, getByText } = getWrapper()

    expect(getByTestId('InviteModalShareButton')).toBeDisabled()
    expect(getByText('inviteWithUrl.title')).toBeTruthy()
    expect(getByTestId('InviteModalStyledDescription')).toHaveTextContent('inviteWithUrl.body')
  })

  it('should enable button when share URL is loaded', async () => {
    mockCreateInviteLink.mockResolvedValue('https://vlra.app/abc123')
    const { getByTestId } = getWrapper()

    await waitFor(() => expect(getByTestId('InviteModalShareButton')).not.toBeDisabled())
  })

  it('should share when button is pressed', async () => {
    mockCreateInviteLink.mockResolvedValue('https://vlra.app/abc123')
    mockShare.mockResolvedValue({
      action: Share.sharedAction,
      activityType: 'clipboard',
    })

    const { getByTestId } = getWrapper()

    await waitFor(() => expect(getByTestId('InviteModalShareButton')).not.toBeDisabled())
    press(getByTestId('InviteModalShareButton'))

    expect(Share.share).toHaveBeenCalledTimes(1)
    expect(Share.share).toHaveBeenCalledWith({
      message: 'inviteWithUrl.share, {"shareUrl":"https://vlra.app/abc123"}',
    })

    await waitFor(() => expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(InviteEvents.invite_with_referral_url, {
      action: 'sharedAction',
      activityType: 'clipboard',
    })
  })

  it('should share when invite rewards NFTs is active and button is pressed', async () => {
    mockCreateInviteLink.mockResolvedValue('https://vlra.app/abc123')
    mockShare.mockResolvedValue({
      action: Share.sharedAction,
      activityType: 'clipboard',
    })

    const { getByTestId, getByText } = getWrapper({
      inviteRewardsVersion: 'v4',
      phoneNumberVerified: true,
    })

    expect(getByText('inviteWithUrl.rewardsActive.title')).toBeTruthy()
    expect(getByTestId('InviteModalStyledDescription')).toHaveTextContent(
      'inviteWithUrl.rewardsActive.body'
    )

    await waitFor(() => expect(getByTestId('InviteModalShareButton')).not.toBeDisabled())
    press(getByTestId('InviteModalShareButton'))

    expect(Share.share).toHaveBeenCalledTimes(1)
    expect(Share.share).toHaveBeenCalledWith({
      message: 'inviteWithRewards, {"link":"https://vlra.app/abc123"}',
    })
  })

  it('should share when invite rewards cUSD is active and button is pressed', async () => {
    mockCreateInviteLink.mockResolvedValue('https://vlra.app/abc123')
    mockShare.mockResolvedValue({
      action: Share.sharedAction,
      activityType: 'clipboard',
    })

    const { getByTestId, getByText } = getWrapper({
      inviteRewardsVersion: 'v5',
      phoneNumberVerified: true,
    })

    expect(getByText('inviteWithUrl.rewardsActiveCUSD.title')).toBeTruthy()
    expect(getByTestId('InviteModalStyledDescription')).toHaveTextContent(
      'inviteWithUrl.rewardsActiveCUSD.body'
    )

    await waitFor(() => expect(getByTestId('InviteModalShareButton')).not.toBeDisabled())
    press(getByTestId('InviteModalShareButton'))

    expect(Share.share).toHaveBeenCalledTimes(1)
    expect(Share.share).toHaveBeenCalledWith({
      message: 'inviteWithRewardsCUSD, {"link":"https://vlra.app/abc123"}',
    })
  })
})
