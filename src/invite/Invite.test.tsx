import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { noop } from 'lodash'
import React from 'react'
import { Share } from 'react-native'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { InviteEvents } from 'src/analytics/Events'
import * as InviteUtils from 'src/firebase/dynamicLinks'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { createMockStore } from 'test/utils'
import Invite from './Invite'

jest.mock('src/statsig')
jest.mock('src/analytics/AppAnalytics')
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
  }: { inviteRewardsVersion?: string; phoneNumberVerified?: boolean } = {}) => {
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
      if (configName === StatsigDynamicConfigs.APP_CONFIG) {
        return {
          minRequiredVersion: '0.0.0',
          inviteRewardsVersion: inviteRewardsVersion || 'none',
          links: {
            web: '',
            tos: '',
            privacy: '',
            faq: '',
            funding: '',
            forum: '',
            swapLearnMore: '',
            transactionFeesLearnMore: '',
            inviteRewardsNftsLearnMore: '',
            inviteRewardsStableTokenLearnMore: '',
            earnStablecoinsLearnMore: '',
            celoEducation: '',
            dappList: '',
            celoNews: '',
          },
        }
      }
      return {} as any
    })

    return render(
      <Provider
        store={createMockStore({
          web3: {
            account: '0xabc123',
          },
          app: {
            phoneNumberVerified,
          },
        })}
      >
        <Invite />
      </Provider>
    )
  }

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

    await waitFor(() => expect(AppAnalytics.track).toHaveBeenCalledTimes(1))
    expect(AppAnalytics.track).toHaveBeenCalledWith(InviteEvents.invite_with_referral_url, {
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
      phoneNumberVerified: true,
      inviteRewardsVersion: 'v4',
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
      phoneNumberVerified: true,
      inviteRewardsVersion: 'v5',
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
