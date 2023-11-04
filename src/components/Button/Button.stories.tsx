// stories/MyButton.stories.tsx
import { Meta, StoryFn } from '@storybook/react'
import React from 'react'

import { MyButton } from './Button'

/**
 * # Button stories
 * These stories showcase the button
 */
const meta: Meta<typeof MyButton> = {
  title: 'components/MyButton',
  component: MyButton,
}

export default meta

export const Basic: StoryFn<typeof MyButton> = (args) => <MyButton {...args} />

Basic.args = {
  text: 'Hello World',
  color: 'purple',
}
