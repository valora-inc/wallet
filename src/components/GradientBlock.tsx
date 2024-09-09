import * as React from 'react'
import LinearGradient from 'react-native-linear-gradient'

type Props = Omit<LinearGradient['props'], 'colors'> & {
  colors?: LinearGradient['props']['colors']
}

export default function GradientBlock({ style, ...props }: Props) {
  return (
    <LinearGradient
      colors={['#26D98A', '#FFD52C']}
      locations={[0, 0.8915]}
      useAngle={true}
      angle={90}
      style={[{ height: 1 }, style]}
      {...props}
    />
  )
}
