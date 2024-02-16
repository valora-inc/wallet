import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const AttentionIcon = ({
  color = Colors.warningDark,
  size = 16,
  testId,
}: {
  color?: Colors
  size?: number
  testId?: string
}) => (
  <Svg width={size} height={size} fill="none" testID={testId} viewBox="0 0 16 16">
    <Path
      d="M7.2 10.4h1.6V12H7.2v-1.6Zm0-6.4h1.6v4.8H7.2V4Zm.792-4C3.576 0 0 3.584 0 8s3.576 8 7.992 8C12.416 16 16 12.416 16 8s-3.584-8-8.008-8ZM8 14.4A6.398 6.398 0 0 1 1.6 8c0-3.536 2.864-6.4 6.4-6.4 3.536 0 6.4 2.864 6.4 6.4 0 3.536-2.864 6.4-6.4 6.4Z"
      fill={color}
    />
  </Svg>
)

export default AttentionIcon
