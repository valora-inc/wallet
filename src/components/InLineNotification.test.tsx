import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import InLineNotification, { Severity } from 'src/components/InLineNotification'

describe(InLineNotification, () => {
  it('does not render CTA when onPress function is not provided', async () => {
    const { getByText, queryByText } = render(
      <InLineNotification
        severity={Severity.Informational}
        title={'Title'}
        description={'Description'}
        ctaLabel={'Action 1'}
        onPressCta={jest.fn()}
        ctaLabel2={'Action 2'}
      />
    )

    expect(getByText('Title')).toBeTruthy()
    expect(getByText('Description')).toBeTruthy()
    expect(getByText('Action 1')).toBeTruthy()
    expect(queryByText('Action 2')).toBeFalsy()
  })

  it('calls onPress function when pressed', async () => {
    const fn = jest.fn()
    const fn2 = jest.fn()
    const { getByText } = render(
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

    fireEvent.press(getByText('Action 1'))
    fireEvent.press(getByText('Action 2'))

    expect(fn).toBeCalled()
    expect(fn2).toBeCalled()
  })

  it('renders the icon when showIcon is true', () => {
    const { getByTestId } = render(
      <InLineNotification severity={Severity.Warning} description="Test" showIcon={true} />
    )

    expect(getByTestId('attentionIcon').children.length).toBeGreaterThan(0)
  })

  it('does not render the icon when showIcon is false', () => {
    const { getByTestId } = render(
      <InLineNotification severity={Severity.Warning} description="Test" showIcon={false} />
    )

    expect(getByTestId('attentionIcon').children.length).toBe(0)
  })
})
