import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import CancelButton from 'src/components/CancelButton'

describe('CancelButton', () => {
  it('displays cancel', () => {
    const { queryByText } = render(<CancelButton />)
    expect(queryByText('cancel')).toBeTruthy()
  })
})
