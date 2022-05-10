import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import ErrorScreen from 'src/app/ErrorScreen'
import { Screens } from 'src/navigator/Screens'

const mockRoute = {
  name: Screens.ErrorScreen as Screens.ErrorScreen,
  key: '1',
  params: {},
}

describe('ErrorScreen', () => {
  describe('with errorMessage', () => {
    it('renders correctly', () => {
      const tree = render(<ErrorScreen route={mockRoute} errorMessage={'Déjà vu'} />)
      expect(tree).toMatchSnapshot()
    })
  })
  describe('without errorMessage', () => {
    it('renders correctly', () => {
      const tree = render(<ErrorScreen route={mockRoute} />)
      expect(tree).toMatchSnapshot()
    })
  })
})
