import * as React from 'react'
import Svg, { Path, Circle } from 'svgs'

function VerificationPending() {
  return (
    <Svg
      testID="VerificationPendingIcon"
      width={60}
      height={60}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Circle cx={30} cy={30} r={30} fill="#F9F6F0" />
      <Path
        d="M30 22.5V30h6"
        stroke="orange"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={30} cy={30} r={11.25} stroke="orange" strokeWidth={1.5} />
    </Svg>
  )
}

export default React.memo(VerificationPending)
