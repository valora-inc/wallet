import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
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

  it('should call onPress with clipboard content when button is pressed', async () => {
    mockGetFreshClipboardContent.mockResolvedValue('mocked-value')
    const { getByText } = render(<PasteButton onPress={onPress} />)
    fireEvent.press(getByText('paste'))
    await waitFor(() => {
      expect(onPress).toHaveBeenCalledWith('mocked-value')
    })
  })
})
