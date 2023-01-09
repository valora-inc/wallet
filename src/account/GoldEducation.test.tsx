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

describe('when first time (!account.goldEducationCompleted)', () => {
  it('does not show the close button', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ account: { goldEducationCompleted: false } })}>
        <GoldEducation />
      </Provider>
    )

    expect(getByTestId('DrawerTopBar')).toBeTruthy()
  })
})

describe('when not first time (account.goldEducationCompleted)', () => {
  it('shows the close button', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ account: { goldEducationCompleted: true } })}>
        <GoldEducation />
      </Provider>
    )

    expect(getByTestId('Education/top').findByProps({ testID: 'Education/CloseIcon' })).toBeTruthy()
  })
})
