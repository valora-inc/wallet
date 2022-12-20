import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { CeloNewsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CeloNewsFeed from 'src/exchange/CeloNewsFeed'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

describe('CeloNewsFeed', () => {
  it('renders and behaves correctly', async () => {
    const store = createMockStore({})

    const tree = render(
      <Provider store={store}>
        <CeloNewsFeed />
      </Provider>
    )

    // Check we can see the Celo news header
    expect(tree.queryByText('celoNews.headerTitle')).toBeTruthy()

    // Check we can see a news item
    expect(tree.queryByText('Announcing Kuneco Changes & New Celo Block Party')).toBeTruthy()

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
})
