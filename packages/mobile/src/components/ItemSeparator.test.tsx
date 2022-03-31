import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import { render } from '@testing-library/react-native'
import * as React from 'react'

it('renders correctly', () => {
  const tree = render(<ItemSeparator />)
  expect(tree).toMatchSnapshot()
})
