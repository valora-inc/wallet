import { fireEvent, render } from '@testing-library/react-native'
import MockDate from 'mockdate'
import React from 'react'
import { Image } from 'react-native'
import CeloNewsFeedItem from 'src/exchange/CeloNewsFeedItem'
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

MockDate.set(new Date('2022-10-01T00:00:00.000Z'))

describe('CeloNewsFeedItem', () => {
  it('renders and behaves correctly', async () => {
    const tree = render(<CeloNewsFeedItem article={TEST_ARTICLE} />)

    // Check key elements are rendered
    expect(tree.queryByText(TEST_ARTICLE.title)).toBeTruthy()
    expect(tree.queryByText(TEST_ARTICLE.author)).toBeTruthy()
    expect(tree.queryByText('1 month')).toBeTruthy()
    expect(tree.UNSAFE_getByType(Image).props.source).toEqual({ uri: TEST_ARTICLE.articleImage })

    // Check we can navigate to the article
    fireEvent.press(tree.getByText(TEST_ARTICLE.title))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: TEST_ARTICLE.link,
    })
  })
})
