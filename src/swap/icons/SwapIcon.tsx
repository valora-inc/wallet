import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors, { Colors } from 'src/styles/colors'

interface Props {
  size?: number
  color?: colors
}

const SwapIcon = ({ size = 16, color = Colors.gray3 }: Props) => (
  <Svg width={size} height={size} fill="none" viewBox="0 0 16 16">
    <Path
      fill={color}
      d="M8.033 13.333c-1.488 0-2.755-.516-3.8-1.55C3.19 10.75 2.667 9.49 2.667 8v-.117L1.6 8.95l-.933-.933L3.333 5.35 6 8.017l-.933.933L4 7.883V8c0 1.111.392 2.056 1.175 2.833C5.958 11.611 6.911 12 8.033 12c.29 0 .573-.033.85-.1.278-.067.55-.167.817-.3l1 1a5.501 5.501 0 0 1-1.3.55c-.444.122-.9.183-1.367.183Zm4.634-2.683L10 7.983l.933-.933L12 8.117V8c0-1.111-.392-2.056-1.175-2.833C10.042 4.389 9.09 4 7.967 4a3.63 3.63 0 0 0-.85.1 3.81 3.81 0 0 0-.817.3l-1-1a5.5 5.5 0 0 1 1.3-.55 5.13 5.13 0 0 1 1.367-.183c1.489 0 2.755.516 3.8 1.55C12.81 5.25 13.333 6.51 13.333 8v.117L14.4 7.05l.933.933-2.666 2.667Z"
    />
  </Svg>
)
export default SwapIcon
