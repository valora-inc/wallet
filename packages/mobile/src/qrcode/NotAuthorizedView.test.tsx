import { render } from '@testing-library/react-native'
import * as React from 'react'
import NotAuthorizedView from 'src/qrcode/NotAuthorizedView'

describe('NotAuthorizedView', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<NotAuthorizedView />)

    expect(toJSON()).toMatchSnapshot()
  })
})
