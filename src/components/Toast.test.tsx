import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'

describe('Toast', () => {
  it('renders the correct elements', () => {
    const { getByText } = render(
      <Toast
        showToast
        hideIcon
        variant={NotificationVariant.Info}
        title="some title"
        description="some message"
        ctaLabel="some cta"
        onPressCta={jest.fn()}
      />
    )

    expect(getByText('some title')).toBeTruthy()
    expect(getByText('some message')).toBeTruthy()
    expect(getByText('some cta')).toBeTruthy()
  })

  it('fires the correct callback on press', () => {
    const onPressSpy = jest.fn()
    const { getByText } = render(
      <Toast
        showToast
        hideIcon
        variant={NotificationVariant.Info}
        description="some message"
        ctaLabel="some cta"
        onPressCta={onPressSpy}
      />
    )

    fireEvent.press(getByText('some cta'))

    expect(onPressSpy).toHaveBeenCalledTimes(1)
  })
})
