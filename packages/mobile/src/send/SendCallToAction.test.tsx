import VerifyPhone from '@celo/react-components/icons/VerifyPhone'
import { render } from '@testing-library/react-native'
import * as React from 'react'
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
