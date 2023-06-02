import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import HeaderButtons from 'src/dappsExplorer/HeaderButtons'
import { mocked } from 'ts-jest/utils'
import { getExperimentParams } from 'src/statsig'

jest.mock('src/statsig', () => ({
  getExperimentParams: jest.fn(() => ({
    showQrScanner: false,
  })),
}))

describe('HeaderButtons', () => {
  it('shows QR button when experiment enabled', () => {
    mocked(getExperimentParams).mockReturnValueOnce({
      showQrScanner: true,
    })
    const { queryByTestId } = render(
      <HeaderButtons onPressHelp={jest.fn()} testID={'HeaderButtons'} />
    )
    expect(queryByTestId('HeaderButtons/QRScanButton')).toBeTruthy()
    expect(queryByTestId('HeaderButtons/HelpIcon')).toBeTruthy()
  })
  it('does not show QR button when experiment disabled', () => {
    const { queryByTestId } = render(
      <HeaderButtons onPressHelp={jest.fn()} testID={'HeaderButtons'} />
    )
    expect(queryByTestId('HeaderButtons/QRScanButton')).toBeFalsy()
    expect(queryByTestId('HeaderButtons/HelpIcon')).toBeTruthy()
  })
  it('calls callback on help press', () => {
    const mockPressHelp = jest.fn()
    const { queryByTestId, getByTestId } = render(
      <HeaderButtons onPressHelp={mockPressHelp} testID={'HeaderButtons'} />
    )
    expect(queryByTestId('HeaderButtons/HelpIcon')).toBeTruthy()
    fireEvent.press(getByTestId('HeaderButtons/HelpIcon'))
    expect(mockPressHelp).toHaveBeenCalledTimes(1)
  })
})
