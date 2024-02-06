import { render } from '@testing-library/react-native'
import React from 'react'
import { StyleSheet } from 'react-native'
import { Severity } from 'src/components/InLineNotification'
import BottomSheetInLineNotification from './BottomSheetInLineNotification'

describe('BottomSheetInLineNotification', () => {
  it('renders correctly when showNotification is true', () => {
    const { getByText } = render(
      <BottomSheetInLineNotification
        severity={Severity.Warning}
        description="Test description"
        showNotification={true}
      />
    )
    expect(getByText('Test description')).toBeTruthy()
  })

  it('does not render when showNotification is false', () => {
    const { queryByText } = render(
      <BottomSheetInLineNotification
        severity={Severity.Warning}
        description="Test description"
        showNotification={false}
      />
    )
    expect(queryByText('Test description')).toBeNull()
  })

  it.each(['top', 'bottom'])('renders with a %s position when it is defined', (position: any) => {
    const { getByTestId } = render(
      <BottomSheetInLineNotification
        severity={Severity.Warning}
        description="Test"
        showNotification={true}
        position={position}
      />
    )
    const style = StyleSheet.flatten(getByTestId('notificationContainer').props.style)
    expect(style).toHaveProperty(position)
  })

  it('renders with a bottom position when position property is absent', () => {
    const { getByTestId } = render(
      <BottomSheetInLineNotification
        severity={Severity.Warning}
        description="Test"
        showNotification={true}
      />
    )
    const style = StyleSheet.flatten(getByTestId('notificationContainer').props.style)
    expect(style).toHaveProperty('bottom')
  })
})
