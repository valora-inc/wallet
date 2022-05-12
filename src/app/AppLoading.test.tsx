import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import AppLoading from 'src/app/AppLoading'

describe('AppLoading', () => {
  it('renders correctly', () => {
    const tree = render(<AppLoading />)
    expect(tree).toMatchSnapshot()
  })
})
