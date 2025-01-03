import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import SegmentedControl from 'src/tokens/SegmentedControl'

describe('SegmentedControl', () => {
  it('fires the onChange callback when a button is pressed', () => {
    const onChangeSpy = jest.fn()
    const { getByText } = render(
      <SegmentedControl values={['one', 'two']} selectedIndex={0} onChange={onChangeSpy} />
    )

    fireEvent.press(getByText('two'))
    fireEvent.press(getByText('one'))

    expect(onChangeSpy).toHaveBeenNthCalledWith(1, 'two', 1)
    expect(onChangeSpy).toHaveBeenNthCalledWith(2, 'one', 0)
  })
})
