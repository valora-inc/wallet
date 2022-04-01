import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { BtnTypes } from 'src/components/Button'
import { GethAwareButton } from 'src/geth/GethAwareButton'

it('renders correctly when disconnected', () => {
  const tree = render(
    <GethAwareButton
      onPress={jest.fn()}
      connected={false}
      text={'Celo Button'}
      type={BtnTypes.TERTIARY}
    />
  )
  expect(tree).toMatchSnapshot()
})

it('renders correctly when connected', () => {
  const tree = render(
    <GethAwareButton
      onPress={jest.fn()}
      connected={true}
      text={'Celo Button'}
      type={BtnTypes.TERTIARY}
    />
  )
  expect(tree).toMatchSnapshot()
})
