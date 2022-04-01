import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import SectionHead from 'src/components/SectionHeadGold'

it('renders text', () => {
  const tree = render(<SectionHead text={'This is a Test'} />)
  expect(tree).toMatchSnapshot()
})
