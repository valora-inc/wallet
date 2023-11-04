import { Meta, StoryFn } from '@storybook/react'
import React from 'react'
import { Text } from 'react-native'

import { Shadow } from 'src/styles/styles'
import { Card } from './Card'

/**
 * # Card stories
 * These stories showcase the card
 */
const meta: Meta<typeof Card> = {
  title: 'components/Card',
  component: Card,
  argTypes: {
    rounded: {
      description: 'Rounded corners',
      table: { defaultValue: { summary: 'false' } },
    },
    shadow: {
      description: 'Shadow outside the card',
      options: Shadow,
      control: { type: 'radio' },
      defaultValue: Shadow.Soft,
    },
  },
}

export default meta

export const Basic: StoryFn<typeof Card> = (args) => (
  <Card {...args}>
    <Text>Basic</Text>
  </Card>
)
Basic.args = {
  rounded: false,
  shadow: Shadow.Soft,
}

export const Rounded: StoryFn<typeof Card> = (args) => (
  <Card rounded {...args}>
    <Text>Rounded</Text>
  </Card>
)
Rounded.args = {
  rounded: true,
  shadow: Shadow.Soft,
}
