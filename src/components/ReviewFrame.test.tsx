import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
import ReviewFrame from 'src/components/ReviewFrame'

const Header = () => <Text>Header</Text>
const Footer = () => <Text>Footer</Text>

describe('ReviewFrame', () => {
  it('renders correctly', () => {
    const tree = render(<ReviewFrame navigateBack={jest.fn()} />)
    expect(tree).toMatchSnapshot()
  })
  describe('when Header', () => {
    it('renders with Header', () => {
      const { UNSAFE_getByType } = render(
        <ReviewFrame HeaderComponent={Header} navigateBack={jest.fn()} />
      )
      expect(UNSAFE_getByType(Header)).toBeTruthy()
    })
  })
  describe('when Footer', () => {
    it('renders with Footer', () => {
      const { UNSAFE_getByType } = render(
        <ReviewFrame FooterComponent={Footer} navigateBack={jest.fn()} />
      )
      expect(UNSAFE_getByType(Footer)).toBeTruthy()
    })
  })
  describe('when has confirmButton', () => {
    it('renders Button with associated props', () => {
      const action = jest.fn()
      const { getByText } = render(<ReviewFrame confirmButton={{ text: 'Confirm', action }} />)
      expect(getByText('Confirm')).toBeTruthy()
    })
  })
  describe('when has modifyButton', () => {
    it('renders Button with associated props', () => {
      const action = jest.fn()
      const { getByText } = render(<ReviewFrame modifyButton={{ text: 'Edit', action }} />)
      expect(getByText('Edit')).toBeTruthy()
    })
  })
})
