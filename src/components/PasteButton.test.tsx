import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { GestureResponderEvent } from 'react-native'
import { PasteButton } from './PasteButton'

const mockGetFreshClipboardContent = jest.fn()
jest.mock('src/utils/useClipboard', () => ({
  useClipboard: () => [null, null, mockGetFreshClipboardContent],
}))

describe('PasteButton', () => {
  const onPress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render a button with "paste" text', () => {
    const { getByText } = render(<PasteButton onPress={onPress} />)
    expect(getByText('paste')).toBeTruthy()
  })

  it('should call onPress with clipboard content and event when button is pressed', async () => {
    mockGetFreshClipboardContent.mockResolvedValue('mocked-value')
    const { getByText } = render(<PasteButton onPress={onPress} />)
    const event = { nativeEvent: { timestamp: 123 } } as GestureResponderEvent
    fireEvent.press(getByText('paste'), event)
    await waitFor(() => {
      expect(onPress).toHaveBeenCalledWith('mocked-value', event)
    })
  })
})
