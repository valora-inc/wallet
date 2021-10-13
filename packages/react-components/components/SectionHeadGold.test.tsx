import SectionHead from '@celo/react-components/components/SectionHeadGold'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'

it('renders text', () => {
  const tree = render(<SectionHead text={'This is a Test'} />)
  expect(tree).toMatchSnapshot()
})
