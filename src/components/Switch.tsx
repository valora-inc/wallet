import * as React from 'react'
import { Switch as RNSwitch, SwitchProps } from 'react-native'
import colors from 'src/styles/colors'

export default function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={SWITCH_TRACK}
      thumbColor={colors.backgroundTertiary}
      ios_backgroundColor={colors.inactive}
      {...props}
    />
  )
}

const SWITCH_TRACK = {
  false: colors.inactive,
  true: colors.accent,
}
