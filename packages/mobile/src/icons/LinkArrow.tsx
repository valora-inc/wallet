import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Props {
  size?: number
}

const LinkArrow = ({ size = 32 }: Props) => {
  return (
    <Svg width={size} height={size} viewBox={`0 0 24 24`} fill="none">
      <Path
        d="M4.5 14.5C4.5 17.2614 6.73858 19.5 9.5 19.5H14.5C17.2614 19.5 19.5 17.2614 19.5 14.5V9.5C19.5 6.73858 17.2614 4.5 14.5 4.5H9.5C6.73858 4.5 4.5 6.73858 4.5 9.5V14.5Z"
        stroke="#9CA4A9"
      />
      <Path
        d="M8.23381 15.7656L15.1281 8.87132M15.1281 8.87132H10.8855M15.1281 8.87132V13.114"
        stroke="#9CA4A9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default React.memo(LinkArrow)
