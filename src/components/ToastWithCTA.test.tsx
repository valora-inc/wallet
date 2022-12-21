import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import ToastWithCTA from 'src/components/ToastWithCTA'

describe('ToastWithCTA', () => {
  it('renders the correct elements', () => {
    const { getByText } = render(
      <ToastWithCTA
        showToast
        title="some title"
        message="some message"
        labelCTA="some cta"
        onPress={jest.fn()}
      />
    )

    expect(getByText('some title')).toBeTruthy()
    expect(getByText('some message')).toBeTruthy()
    expect(getByText('some cta')).toBeTruthy()
  })

  it('fires the correct callback on press', () => {
    const onPressSpy = jest.fn()
    const { getByText } = render(
      <ToastWithCTA showToast message="some message" labelCTA="some cta" onPress={onPressSpy} />
    )

    fireEvent.press(getByText('some cta'))

    expect(onPressSpy).toHaveBeenCalledTimes(1)
  })
})
