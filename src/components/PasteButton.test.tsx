import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { GestureResponderEvent } from 'react-native'
import { PasteButton } from './PasteButton'

const mockGetFreshClipboardContent = jest.fn()
jest.mock('src/utils/useClipboard', () => ({
  useClipboard: () => [null, null, mockGetFreshClipboardContent],
}))

describe('PasteButton', () => {
  const emptyValue = ''
  const setValue = jest.fn()
  const onPress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render a button with "paste" text when value is empty', () => {
    const { getByText } = render(
      <PasteButton value={emptyValue} setValue={setValue} onPress={onPress} />
    )
    expect(getByText('paste')).toBeTruthy()
  })

  it('should not render anything when value is not empty', () => {
    const { queryByText } = render(
      <PasteButton value={'some-value'} setValue={setValue} onPress={onPress} />
    )
    expect(queryByText('paste')).toBeNull()
  })

  it('should call setValue with clipboard content when button is pressed', async () => {
    mockGetFreshClipboardContent.mockResolvedValue('mocked-value')
    const { getByText } = render(
      <PasteButton value={emptyValue} setValue={setValue} onPress={onPress} />
    )
    fireEvent.press(getByText('paste'))
    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith('mocked-value')
      expect(onPress).toHaveBeenCalled()
    })
  })

  it('should call onPress with event when button is pressed', async () => {
    mockGetFreshClipboardContent.mockResolvedValue('mocked-value2')
    const { getByText } = render(
      <PasteButton value={emptyValue} setValue={setValue} onPress={onPress} />
    )
    const event = { nativeEvent: { timestamp: 123 } } as GestureResponderEvent
    fireEvent.press(getByText('paste'), event)
    await waitFor(() => {
      expect(setValue).toHaveBeenCalledWith('mocked-value2')
      expect(onPress).toHaveBeenCalledWith(event)
    })
  })
})
