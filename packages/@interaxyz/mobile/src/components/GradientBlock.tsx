import * as React from 'react'
import LinearGradient from 'react-native-linear-gradient'
import Colors from 'src/styles/colors'

type Props = Omit<LinearGradient['props'], 'colors'> & {
  colors?: LinearGradient['props']['colors']
}

export default function GradientBlock({ style, ...props }: Props) {
  return (
    <LinearGradient
      colors={[Colors.gradientBorderLeft, Colors.gradientBorderRight]}
      locations={[0, 0.8915]}
      useAngle={true}
      angle={90}
      style={[{ height: 1 }, style]}
      {...props}
    />
  )
}
