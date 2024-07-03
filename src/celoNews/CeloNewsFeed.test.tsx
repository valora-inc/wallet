import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { CeloNewsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CeloNewsFeed from 'src/celoNews/CeloNewsFeed'
import { CeloNewsArticles } from 'src/celoNews/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'

const mockFetch = fetch as FetchMock

const FAKE_DATA: CeloNewsArticles = {
  articles: [
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-1-msqbpg075ue_544hfbrg-c84fbd8f-da18-4f80-a508-e24d58c33414_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-11-07T14:01:38.000Z',
      id: 109261928,
      link: 'https://blog.celo.org/announcing-kuneco-changes-new-celo-block-party-8ce6113dff93?source=rss-18e0dc50a66e------2',
      title: 'Announcing Kuneco Changes & New Celo Block Party',
      type: 'rss',
    },
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-per9cntvkjyxodl2jbiakw-264269bc-287b-4adb-af44-35bfb8fab48d_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-11-02T13:01:59.000Z',
      id: 109261927,
      link: 'https://blog.celo.org/celo-deutsche-telekoms-partnership-strengthens-with-the-global-launch-of-t-challenge-bd102f07b572?source=rss-18e0dc50a66e------2',
      title:
        'Celo & Deutsche Telekom’s Partnership Strengthens with the Global Launch of T Challenge',
      type: 'rss',
    },
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-33divbsrhss3-chrwflksw-8c2e1020-34ec-4270-9732-442fff285cbe_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-10-07T13:01:56.000Z',
      id: 109261926,
      link: 'https://blog.celo.org/celo-camp-batch-6-teams-announced-with-new-founders-support-from-coinbase-cloud-e3c52087021b?source=rss-18e0dc50a66e------2',
      title: 'Celo Camp Batch 6 Teams Announced with New Founders Support from Coinbase Cloud',
      type: 'rss',
    },
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-ds05i80nbu6hjhmdweiwug-717640c2-be6d-40fe-8c41-d5e764c25e98_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-10-05T19:20:04.000Z',
      id: 109261924,
      link: 'https://blog.celo.org/celo-pilot-tests-whether-quadratic-funding-can-be-used-to-encourage-donations-to-build-financial-160cf143d953?source=rss-18e0dc50a66e------2',
      title:
        'Celo Pilot Tests Whether Quadratic Funding Can Be Used to Encourage Donations to Build Financial…',
      type: 'rss',
    },
    {
      articleImage:
        'https://flockler.com/thumbs/sites/23703/1-cempnstpr_0i8gs0rw3nsa-8bd9d009-b232-4be4-a8ab-c81a1f9ee3e9_s600x0_q80_noupscale.jpeg',
      author: 'Celo Foundation',
      createdAt: '2022-09-19T18:57:53.000Z',
      id: 109261923,
      link: 'https://blog.celo.org/a-celo-nft-backed-rewards-pilot-a-success-in-san-francisco-5d02815d180a?source=rss-18e0dc50a66e------2',
      title: 'A Celo NFT-backed Rewards Pilot a Success In San Francisco',
      type: 'rss',
    },
  ],
  nextPageId: '109261921',
}

beforeEach(() => {
  mockFetch.resetMocks()
})

describe('CeloNewsFeed', () => {
  it('fetches and shows the new articles', async () => {
    mockFetch.mockResponseOnce(JSON.stringify(FAKE_DATA), {
      status: 200,
    })

    const store = createMockStore({})

    const tree = render(
      <Provider store={store}>
        <CeloNewsFeed />
      </Provider>
    )

    // Check we can see the Celo news header
    expect(tree.queryByText('celoNews.headerTitle')).toBeTruthy()
    // Check we can see the skeleton placeholder
    expect(tree.queryAllByTestId('CeloNewsFeedItemSkeleton')[0]).toBeTruthy()
    // Check we cannot see the error view
    expect(tree.queryByText('celoNews.loadingError')).toBeFalsy()
    // Check we cannot see the read more button
    expect(tree.queryByText('celoNews.readMoreButtonText')).toBeFalsy()
    // Check the analytics event is fired
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(CeloNewsEvents.celo_news_screen_open)

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))
    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.cloudFunctionsUrl}/getCeloNewsFeed`,
      expect.any(Object)
    )

    // Check we can see a news item
    expect(tree.queryByText('Announcing Kuneco Changes & New Celo Block Party')).toBeTruthy()
    // Check we cannot see the skeleton placeholder
    expect(tree.queryByTestId('CeloNewsFeedItemSkeleton')).toBeFalsy()
    // Check we cannot see the error view
    expect(tree.queryByText('celoNews.loadingError')).toBeFalsy()

    // Check we can read more
    fireEvent.press(tree.getByText('celoNews.readMoreButtonText'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: 'https://blog.celo.org',
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      CeloNewsEvents.celo_news_bottom_read_more_tap,
      {
        url: 'https://blog.celo.org',
      }
    )
  })

  it('shows an error view with a retry button when the data fails to load', async () => {
    mockFetch.mockResponse('', { status: 500 })

    const store = createMockStore({})

    const tree = render(
      <Provider store={store}>
        <CeloNewsFeed />
      </Provider>
    )

    // Check we can see the Celo news header
    expect(tree.queryByText('celoNews.headerTitle')).toBeTruthy()
    // Check we cannot see the error view
    expect(tree.queryByText('celoNews.loadingError')).toBeFalsy()
    // Check we cannot see the read more button
    expect(tree.queryByText('celoNews.readMoreButtonText')).toBeFalsy()

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    // Check we cannot see the Celo news header
    expect(tree.queryByText('celoNews.headerTitle')).toBeFalsy()
    // Check we cannot see the skeleton placeholder
    expect(tree.queryByTestId('CeloNewsFeedItemSkeleton')).toBeFalsy()
    // Check we can see the error view
    expect(tree.queryByText('celoNews.loadingError')).toBeTruthy()
    // Check we cannot see the read more button
    expect(tree.queryByText('celoNews.readMoreButtonText')).toBeFalsy()

    // Check we can retry
    fireEvent.press(tree.getByText('celoNews.retryButtonText'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(CeloNewsEvents.celo_news_retry_tap)
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
  })
})
