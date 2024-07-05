import * as React from 'react'
import Colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: string
}

const ComingSoonClock = ({ size = 24, color = Colors.black }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      d="M14 16c-2.233 0-4.125-.775-5.675-2.325C6.775 12.125 6 10.233 6 8c0-2.217.775-4.104 2.325-5.662C9.875.779 11.767 0 14 0c2.217 0 4.104.78 5.663 2.337C21.22 3.896 22 5.784 22 8c0 2.233-.78 4.125-2.337 5.675C18.104 15.225 16.216 16 14 16Zm0-2c1.667 0 3.083-.583 4.25-1.75C19.417 11.083 20 9.667 20 8c0-1.667-.583-3.083-1.75-4.25C17.083 2.583 15.667 2 14 2c-1.667 0-3.083.583-4.25 1.75C8.583 4.917 8 6.333 8 8c0 1.667.583 3.083 1.75 4.25C10.917 13.417 12.333 14 14 14Zm2.275-2.275L17.7 10.3 15 7.6V4h-2v4.425l3.275 3.3ZM1 5V3h4v2H1ZM0 9V7h5v2H0Zm1 4v-2h4v2H1Z"
    />
  </Svg>
)
export default ComingSoonClock
