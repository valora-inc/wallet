import { render } from '@testing-library/react-native'
import * as React from 'react'
import VerifyPhone from 'src/icons/VerifyPhone'
import { SendCallToAction } from 'src/send/SendCallToAction'

describe('SendCallToAction', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <SendCallToAction
        icon={<VerifyPhone height={49} />}
        header={'header'}
        body={'body'}
        cta={'cta'}
        onPressCta={jest.fn()}
      />
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
