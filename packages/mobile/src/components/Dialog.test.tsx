import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import Dialog from 'src/components/Dialog'

it('renders correctly', () => {
  const onPress = jest.fn()
  const tree = render(
    <Dialog isVisible={true} title="Dialog" actionPress={onPress} actionText="Press Me">
      "HELLO"
    </Dialog>
  )
  expect(tree).toMatchSnapshot()
})
