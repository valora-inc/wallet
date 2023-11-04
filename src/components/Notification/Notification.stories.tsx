import { Meta, StoryFn } from '@storybook/react'
import React from 'react'

import Notification from './Notification'

/**
 * # Notification stories
 * These stories showcase the notification
 */
const meta: Meta<typeof Notification> = {
  title: 'components/Notification',
  component: Notification,
}

export default meta

export const Informational: StoryFn<typeof Notification.Informational> = (args) => (
  <Notification.Informational {...args} />
)
Informational.args = {
  title: 'Headline',
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
  ctaLabel2: 'Action 2',
  onPressCta2: () => {},
}

export const InformationalWithoutHeadline: StoryFn<typeof Notification.Informational> = (args) => (
  <Notification.Informational {...args} />
)
InformationalWithoutHeadline.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
  ctaLabel2: 'Action 2',
  onPressCta2: () => {},
}

export const InformationalWithoutActions: StoryFn<typeof Notification.Informational> = (args) => (
  <Notification.Informational {...args} />
)
InformationalWithoutActions.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
}

export const InformationalWithSingleAction: StoryFn<typeof Notification.Informational> = (args) => (
  <Notification.Informational {...args} />
)
InformationalWithSingleAction.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
}

export const Warn: StoryFn<typeof Notification.Warning> = (args) => (
  <Notification.Warning {...args} />
)
Warn.args = {
  title: 'Headline',
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
  ctaLabel2: 'Action 2',
  onPressCta2: () => {},
}

export const WarningWithoutHeadline: StoryFn<typeof Notification.Warning> = (args) => (
  <Notification.Warning {...args} />
)
WarningWithoutHeadline.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
  ctaLabel2: 'Action 2',
  onPressCta2: () => {},
}

export const WarningWithoutActions: StoryFn<typeof Notification.Warning> = (args) => (
  <Notification.Warning {...args} />
)
WarningWithoutActions.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
}

export const WarningWithSingleAction: StoryFn<typeof Notification.Warning> = (args) => (
  <Notification.Warning {...args} />
)
WarningWithSingleAction.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
}

export const Error: StoryFn<typeof Notification.Error> = (args) => <Notification.Error {...args} />
Error.args = {
  title: 'Headline',
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
  ctaLabel2: 'Action 2',
  onPressCta2: () => {},
}

export const ErrorWithoutHeadline: StoryFn<typeof Notification.Error> = (args) => (
  <Notification.Error {...args} />
)
ErrorWithoutHeadline.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
  ctaLabel2: 'Action 2',
  onPressCta2: () => {},
}

export const ErrorWithoutActions: StoryFn<typeof Notification.Error> = (args) => (
  <Notification.Error {...args} />
)
ErrorWithoutActions.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
}

export const ErrorWithSingleAction: StoryFn<typeof Notification.Error> = (args) => (
  <Notification.Error {...args} />
)
ErrorWithSingleAction.args = {
  description:
    'Describe the info in two sentences or less. Do not use terminal punctuation if only using one sentence. ',
  ctaLabel: 'Action 1',
  onPressCta: () => {},
}
