import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { CeloNewsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CeloNewsFeedItem from 'src/celoNews/CeloNewsFeedItem'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

const TEST_ARTICLE = {
  articleImage:
    'https://flockler.com/thumbs/sites/23703/1-1-msqbpg075ue_544hfbrg-c84fbd8f-da18-4f80-a508-e24d58c33414_s600x0_q80_noupscale.jpeg',
  author: 'Celo Foundation',
  createdAt: '2022-11-07T14:01:38.000Z',
  id: 109261928,
  link: 'https://blog.celo.org/announcing-kuneco-changes-new-celo-block-party-8ce6113dff93?source=rss-18e0dc50a66e------2',
  title: 'Announcing Kuneco Changes & New Celo Block Party',
  type: 'rss',
}

describe('CeloNewsFeedItem', () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date('2022-10-01T00:00:00.000Z'),
    })
  })
  it('renders and behaves correctly', async () => {
    const tree = render(<CeloNewsFeedItem article={TEST_ARTICLE} />)

    // Check key elements are rendered
    expect(tree.queryByText(TEST_ARTICLE.title)).toBeTruthy()
    expect(tree.queryByText(TEST_ARTICLE.author)).toBeTruthy()
    expect(tree.queryByText('1 month')).toBeTruthy()
    expect(tree.queryByTestId('CeloNewsFeedItemImage')?.props.source).toEqual({
      uri: TEST_ARTICLE.articleImage,
    })

    // Check we can navigate to the article
    fireEvent.press(tree.getByText(TEST_ARTICLE.title))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: TEST_ARTICLE.link,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(CeloNewsEvents.celo_news_article_tap, {
      url: TEST_ARTICLE.link,
    })
  })
})
