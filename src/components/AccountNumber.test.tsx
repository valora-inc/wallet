import Clipboard from '@react-native-clipboard/clipboard'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import AccountNumber from 'src/components/AccountNumber'
import { mockAccount } from 'test/values'

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
