import SectionHeadNew from '@celo/react-components/components/SectionHead'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'

it('renders text', () => {
  const tree = render(<SectionHeadNew text={'This is a Test'} />)
  expect(tree).toMatchSnapshot()
})
