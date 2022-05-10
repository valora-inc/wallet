import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import SectionHeadNew from 'src/components/SectionHead'

it('renders text', () => {
  const tree = render(<SectionHeadNew text={'This is a Test'} />)
  expect(tree).toMatchSnapshot()
})
