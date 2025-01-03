import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  color?: string
}

const Refresh = ({ color, height }: Props) => (
  <Svg
    width={height}
    height={height}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    testID="Refresh"
    viewBox="0 0 24 24"
  >
    <Path
      d="M17.362 3.285A10 10 0 0 0 11.025 1l-.002.408a9.592 9.592 0 1 1-7.13 3.15v3.177h.409V3.869H1.228v.409h2.369a10 10 0 1 0 13.765-.993Z"
      fill={color}
      stroke={color}
      strokeWidth={1.5}
      strokeMiterlimit={5}
      strokeLinejoin="round"
    />
  </Svg>
)

Refresh.defaultProps = {
  height: 16,
  color: colors.black,
}

export default Refresh
