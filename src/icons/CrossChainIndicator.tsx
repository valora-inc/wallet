import * as React from 'react'
import colors, { Colors } from 'src/styles/colors'
import Svg, { G, Circle, Path, Defs, ClipPath } from 'react-native-svg'

interface Props {
  size?: number
  color?: colors
}

function CrossChainIndicator({ size = 16, color = Colors.gray3 }: Props) {
  return (
    <Svg width={size} height={size} fill="none">
      <G clipPath="url(#a)">
        <Circle cx={3} cy={11} r={1.5} stroke={color} />
        <Circle cx={13} cy={11} r={1.5} fill={color} stroke={color} />
        <Path
          fill={color}
          strokeWidth={0.1}
          stroke={color}
          d="M14 10a6 6 0 0 0-12 0h1.41a4.59 4.59 0 0 1 9.18 0H14Z"
        />
        <Path
          fill={color}
          stroke={color}
          strokeLinejoin="round"
          strokeWidth={2}
          d="M14 10a6 6 0 0 0-12 0h1.41a4.59 4.59 0 0 1 9.18 0H14Z"
          mask="url(#b)"
        />
      </G>
      <Defs>
        <ClipPath id="a">
          <Path fill="#fff" d="M1 4h14v9H1z" />
        </ClipPath>
      </Defs>
    </Svg>
  )
}
export default CrossChainIndicator
