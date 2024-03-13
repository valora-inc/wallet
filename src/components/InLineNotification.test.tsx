import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import AttentionIcon from 'src/icons/Attention'

describe(InLineNotification, () => {
  it('does not render CTA when onPress function is not provided', async () => {
    const { getByText, queryByText } = render(
      <InLineNotification
        variant={NotificationVariant.Info}
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
        variant={NotificationVariant.Info}
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

  it('renders the standard icon when the icon is not overridden', () => {
    const { getByTestId } = render(
      <InLineNotification variant={NotificationVariant.Info} description="Test" />
    )

    expect(getByTestId('InLineNotification/Icon')).toBeTruthy()
  })

  it('renders the provided icon when a custom icon is specified', () => {
    const { getByTestId } = render(
      <InLineNotification
        variant={NotificationVariant.Warning}
        description="Test"
        customIcon={<AttentionIcon testId="TestIcon" />}
      />
    )

    expect(getByTestId('TestIcon')).toBeTruthy()
  })

  it('does not render the icon when `hideIcon` prop is set', () => {
    const { queryByTestId } = render(
      <InLineNotification variant={NotificationVariant.Info} description="Test" hideIcon />
    )

    expect(queryByTestId('InLineNotification/Icon')).toBeFalsy()
  })
})
