import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import { render } from '@testing-library/react-native'
import * as React from 'react'

describe(NumberKeypad, () => {
  it('renders correctly without decimal separator', () => {
    const tree = render(<NumberKeypad onDigitPress={jest.fn()} onBackspacePress={jest.fn()} />)
    expect(tree).toMatchSnapshot()
  })
  it('renders correctly with decimal separator', () => {
    const tree = render(
      <NumberKeypad
        onDigitPress={jest.fn()}
        onBackspacePress={jest.fn()}
        decimalSeparator={','}
        onDecimalPress={jest.fn()}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
