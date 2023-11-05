import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import Notification from 'src/components/Notification'

describe(Notification, () => {
  it('does not render CTA when onPress function is not provided', async () => {
    const { findByText } = render(
      <Notification.Informational
        title={'Title'}
        description={'Description'}
        ctaLabel={'Action 1'}
        onPressCta={() => {}}
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
      <Notification.Informational
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

  it('renders correctly with headline, description and actions', () => {
    const tree = render(
      <Notification.Informational
        title={'Title'}
        description={'Description'}
        ctaLabel={'Action 1'}
        onPressCta={() => {}}
        ctaLabel2={'Action 2'}
        onPressCta2={() => {}}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with description and actions', () => {
    const tree = render(
      <Notification.Informational
        description={'Description'}
        ctaLabel={'Action 1'}
        onPressCta={() => {}}
        ctaLabel2={'Action 2'}
        onPressCta2={() => {}}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with description', () => {
    const tree = render(<Notification.Informational description={'Description'} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with headline and description', () => {
    const tree = render(<Notification.Informational title={'Title'} description={'Description'} />)
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly Warning', () => {
    const tree = render(
      <Notification.Warning
        title={'Title'}
        description={'Description'}
        ctaLabel={'Action 1'}
        onPressCta={() => {}}
        ctaLabel2={'Action 2'}
        onPressCta2={() => {}}
      />
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly Error', () => {
    const tree = render(
      <Notification.Error
        title={'Title'}
        description={'Description'}
        ctaLabel={'Action 1'}
        onPressCta={() => {}}
        ctaLabel2={'Action 2'}
        onPressCta2={() => {}}
      />
    )
    expect(tree).toMatchSnapshot()
  })
})
