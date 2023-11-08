import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import InLineNotification, { Severity } from 'src/components/InLineNotification'

describe(InLineNotification, () => {
  it('does not render CTA when onPress function is not provided', async () => {
    const { findByText } = render(
      <InLineNotification
        severity={Severity.Informational}
        title={'Title'}
        description={'Description'}
        ctaLabel={'Action 1'}
        onPressCta={jest.fn()}
        ctaLabel2={'Action 2'}
      />
    )

    await expect(findByText('Action 1')).resolves.toBeDefined()
    await expect(findByText('Action 2')).rejects.toThrow()
  })

  it('calls onPress function when pressed', async () => {
    const fn = jest.fn()
    const fn2 = jest.fn()
    const { findByText } = render(
      <InLineNotification
        severity={Severity.Informational}
        title={'Title'}
        description={'Description'}
        ctaLabel={'Action 1'}
        onPressCta={fn}
        ctaLabel2={'Action 2'}
        onPressCta2={fn2}
      />
    )

    fireEvent.press(await findByText('Action 1'))
    fireEvent.press(await findByText('Action 2'))

    expect(fn).toBeCalled()
    expect(fn2).toBeCalled()
  })
})
