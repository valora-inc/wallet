import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import LinkBankAccountScreen from 'src/account/LinkBankAccountScreen'
import { KycStatus } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

describe('LinkBankAccountScreen', () => {
  describe('renders correctly for each possible kycStatus', () => {
    const kycValues: (KycStatus | undefined)[] = Object.values(KycStatus)
    kycValues.push(undefined)
    kycValues.forEach((kycValue) => {
      it(`renders correctly for a KycStatus of `, () => {
        const { toJSON } = render(<LinkBankAccountScreen kycStatus={kycValue} />)
        expect(toJSON()).toMatchSnapshot()
      })
    })
  })
  it('redirects correctly to SupportContact when button is clicked in kycStatus failed state', async () => {
    const tree = render(<LinkBankAccountScreen kycStatus={KycStatus.Failed} />)
    fireEvent.press(tree.getByTestId('SupportContactLink'))
    expect(navigate).toBeCalledWith(Screens.SupportContact)
  })
  it('redirects correctly to SupportContact when button is clicked in kycStatus pending state', async () => {
    const tree = render(<LinkBankAccountScreen kycStatus={KycStatus.Failed} />)
    fireEvent.press(tree.getByTestId('SupportContactLink'))
    expect(navigate).toBeCalledWith(Screens.SupportContact)
  })
})
