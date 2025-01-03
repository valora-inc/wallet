import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import GoldEducation from 'src/account/GoldEducation'
import { createMockStore } from 'test/utils'

it('renders correctly', () => {
  const tree = render(
    <Provider store={createMockStore({})}>
      <GoldEducation />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('shows the close button when celoEducationCompleted is false', () => {
  const { getByTestId } = render(
    <Provider store={createMockStore({ account: { celoEducationCompleted: false } })}>
      <GoldEducation />
    </Provider>
  )

  expect(getByTestId('Education/top').findByProps({ testID: 'Education/CloseIcon' })).toBeTruthy()
})

it('shows the close button when celoEducationCompleted is true', () => {
  const { getByTestId } = render(
    <Provider store={createMockStore({ account: { celoEducationCompleted: true } })}>
      <GoldEducation />
    </Provider>
  )

  expect(getByTestId('Education/top').findByProps({ testID: 'Education/CloseIcon' })).toBeTruthy()
})
