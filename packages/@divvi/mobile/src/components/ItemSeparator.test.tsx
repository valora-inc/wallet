import { render } from '@testing-library/react-native'
import * as React from 'react'
import ItemSeparator from 'src/components/ItemSeparator'

it('renders correctly', () => {
  const tree = render(<ItemSeparator />)
  expect(tree).toMatchSnapshot()
})
