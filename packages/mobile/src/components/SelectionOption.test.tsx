import SelectionOption from '@celo/react-components/components/SelectionOption'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'

it('renders unselected correctly', () => {
  const tree = render(
    <SelectionOption key={'Example'} text={'Example'} isSelected={false} onSelect={jest.fn()} />
  )
  expect(tree).toMatchSnapshot()
})

it('renders selected correctly', () => {
  const tree = render(
    <SelectionOption key={'Example'} text={'Example'} isSelected={true} onSelect={jest.fn()} />
  )
  expect(tree).toMatchSnapshot()
})
