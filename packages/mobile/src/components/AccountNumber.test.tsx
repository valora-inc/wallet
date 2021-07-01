import Clipboard from '@react-native-community/clipboard'
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import AccountNumber from 'src/components/AccountNumber'
import { mockAccount } from 'test/values'

jest.mock('@react-native-community/clipboard', () => ({
  setString: jest.fn(),
}))

describe('AccountNumber', () => {
  it('renders correctly when touch disabled', async () => {
    const tree = render(<AccountNumber address={mockAccount} touchDisabled={true} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly when touch enabled', async () => {
    const tree = render(<AccountNumber address={mockAccount} />)
    expect(tree).toMatchSnapshot()
  })

  it('copies addresse to clipboard when pressed', async () => {
    const { getByTestId } = render(<AccountNumber address={mockAccount} />)

    fireEvent.press(getByTestId('CopyAddressToClipboard'))
    expect(Clipboard.setString).toHaveBeenCalledWith(mockAccount)
  })
})
