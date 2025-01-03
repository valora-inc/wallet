import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import SegmentedControl from 'src/components/SegmentedControl'

describe(SegmentedControl, () => {
  it('renders correctly', () => {
    const onChange = jest.fn()
    const { getByLabelText } = render(
      <SegmentedControl values={['Tab1', 'Tab2']} selectedIndex={1} onChange={onChange} />
    )

    const tab1 = getByLabelText('Tab1')
    expect(tab1).toBeDefined()
    expect(tab1.props.accessibilityRole).toBe('button')
    // For some reason this isn't set in Jest
    // TODO: investigate why
    // expect(tab1.props.accessibilityStates).toBe([])
    const tab2 = getByLabelText('Tab2')
    expect(tab2).toBeDefined()
    expect(tab1.props.accessibilityRole).toBe('button')
    // For some reason this isn't set in Jest
    // TODO: investigate why
    // expect(tab2.props.accessibilityStates).toBe(['selected'])

    fireEvent.press(tab1)
    expect(onChange).toHaveBeenCalledWith('Tab1', 0)
  })
})
