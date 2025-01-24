import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { ExchangeFeeIcon, SecurityFeeIcon } from 'src/components/FeeIcon'

it('SecurityFeeIcon renders correctly', () => {
  const tree = render(<SecurityFeeIcon />)
  expect(tree).toMatchSnapshot()
})

it('ExchangeFeeIcon renders correctly', () => {
  const tree = render(<ExchangeFeeIcon />)
  expect(tree).toMatchSnapshot()
})
