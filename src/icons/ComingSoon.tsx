import React from 'react'
import Colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: string
}

const ComingSoon = ({ size = 24, color = Colors.black }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      d="M15 20c-2.233 0-4.125-.775-5.675-2.325C7.775 16.125 7 14.233 7 12c0-2.217.775-4.104 2.325-5.662C10.875 4.779 12.767 4 15 4c2.217 0 4.104.78 5.663 2.338C22.22 7.896 23 9.783 23 12c0 2.233-.78 4.125-2.337 5.675C19.104 19.225 17.216 20 15 20Zm0-2c1.667 0 3.083-.583 4.25-1.75C20.417 15.083 21 13.667 21 12c0-1.667-.583-3.083-1.75-4.25C18.083 6.583 16.667 6 15 6c-1.667 0-3.083.583-4.25 1.75C9.583 8.917 9 10.333 9 12c0 1.667.583 3.083 1.75 4.25C11.917 17.417 13.333 18 15 18Zm2.275-2.275L18.7 14.3 16 11.6V8h-2v4.425l3.275 3.3ZM2 9V7h4v2H2Zm-1 4v-2h5v2H1Zm1 4v-2h4v2H2Z"
    />
  </Svg>
)
export default ComingSoon
