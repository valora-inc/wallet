import React from 'react'
import Touchable, { Props } from 'src/components/Touchable'

const HIT_SLOP = { left: 15, bottom: 15, top: 15, right: 15 }

export default function HeaderButton(props: Props) {
  return <Touchable borderless={true} hitSlop={HIT_SLOP} {...props} />
}
