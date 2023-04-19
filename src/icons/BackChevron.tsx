import * as React from 'react'
import Animated from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

const AnimatedPath = Animated.createAnimatedComponent(Path)

export interface Props {
  height?: number
  color?: string | Animated.Node<number | string>
}

function BackChevron({ color, height }: Props) {
  return (
    <Svg height={height} width={height && height / 2} viewBox="0 0 8 16" testID="BackChevron">
      <AnimatedPath
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.707 13.707a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 1.414L2.414 7l5.293 5.293a1 1 0 0 1 0 1.414Z"
        fill={color}
      />
    </Svg>
  )
}

BackChevron.defaultProps = {
  height: 16,
  color: colors.dark,
}

export default BackChevron
