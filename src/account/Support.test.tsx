import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import Support from 'src/account/Support'
import { FAQ_LINK, FORUM_LINK } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore } from 'test/utils'

const renderSupport = () =>
  render(
    <Provider store={createMockStore()}>
      <Support />
    </Provider>
  )

describe('Support', () => {
  it('renders correctly', () => {
    const tree = renderSupport()
    expect(tree).toMatchSnapshot()
  })

  it('navigates to Web FAQ', () => {
    const contact = renderSupport()
    fireEvent.press(contact.getByTestId('FAQLink'))
    expect(navigateToURI).toBeCalledWith(FAQ_LINK)
  })

  it('navigates to Forum', () => {
    const contact = renderSupport()
    fireEvent.press(contact.getByTestId('ForumLink'))
    expect(navigateToURI).toBeCalledWith(FORUM_LINK)
  })

  it('navigates to Contact', () => {
    const contact = renderSupport()
    fireEvent.press(contact.getByTestId('SupportContactLink'))
    expect(navigate).toBeCalledWith(Screens.SupportContact)
  })
})
