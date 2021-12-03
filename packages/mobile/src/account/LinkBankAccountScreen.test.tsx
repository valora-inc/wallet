import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import LinkBankAccountScreen from 'src/account/LinkBankAccountScreen'
import { KycStatus } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Provider } from 'react-redux'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

describe('LinkBankAccountScreen', () => {
  describe('renders correctly for each possible kycStatus', () => {
    const kycValues: (KycStatus | undefined)[] = Object.values(KycStatus)
    kycValues.push(undefined)
    kycValues.forEach((kycValue) => {
      it(`renders correctly for a KycStatus of ${kycValue}`, () => {
        const store = createMockStore({
          web3: { mtwAddress: mockAccount },
          account: { kycStatus: kycValue },
        })
        const { toJSON } = render(
          <Provider store={store}>
            <LinkBankAccountScreen />
          </Provider>
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })
  })
  it('redirects correctly to SupportContact when button is clicked in kycStatus failed state', async () => {
    const store = createMockStore({
      web3: { mtwAddress: mockAccount },
      account: { kycStatus: KycStatus.Failed },
    })
    const tree = render(
      <Provider store={store}>
        <LinkBankAccountScreen />
      </Provider>
    )
    fireEvent.press(tree.getByTestId('SupportContactLink'))
    expect(navigate).toBeCalledWith(Screens.SupportContact, {
      prefilledText: 'linkBankAccountScreen.failed.contactSupportPrefill',
    })
  })
})
