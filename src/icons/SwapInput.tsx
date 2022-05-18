import * as React from 'react'
import Svg, { Path } from 'svgs'

function SwapInput({ height = 16 }) {
  return (
    <Svg
      width={height}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path
        d="M0 4.86508L0.839128 5.68613L3.33494 3.18857L3.33494 15.4711H4.5012L4.5012 3.18857L6.99759 5.68554L7.83614 4.86508L3.91807 0.948173L0 4.86508ZM8.16386 12.0813L12.0819 16L16 12.0813L15.1615 11.2615L12.6651 13.7579L12.6651 1.47591H11.4988L11.4988 13.7584L9.00241 11.2615L8.16386 12.0813Z"
        fill="#81868B"
      />
    </Svg>
  )
}

export default React.memo(SwapInput)
