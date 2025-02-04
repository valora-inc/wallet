import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import Support from 'src/account/Support'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

const renderSupport = () =>
  render(
    <Provider store={createMockStore()}>
      <Support />
    </Provider>
  )

describe('Support', () => {
  beforeEach(() => {
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName }) => {
      if (configName === StatsigDynamicConfigs.APP_CONFIG) {
        return {
          links: {
            faq: 'https://example.com/faq',
            forum: 'https://example.com/forum',
          },
        }
      }
      return {} as any
    })
  })

  it('navigates to Web FAQ', () => {
    const contact = renderSupport()
    fireEvent.press(contact.getByTestId('FAQLink'))
    expect(navigateToURI).toBeCalledWith('https://example.com/faq')
  })

  it('navigates to Forum', () => {
    const contact = renderSupport()
    fireEvent.press(contact.getByTestId('ForumLink'))
    expect(navigateToURI).toBeCalledWith('https://example.com/forum')
  })

  it('navigates to Contact', () => {
    const contact = renderSupport()
    fireEvent.press(contact.getByTestId('SupportContactLink'))
    expect(navigate).toBeCalledWith(Screens.SupportContact)
  })
})
