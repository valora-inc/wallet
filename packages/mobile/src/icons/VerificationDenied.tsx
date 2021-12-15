import * as React from 'react'
import Svg, { Path, Circle } from 'svgs'

function VerificationDenied() {
  return (
    <Svg
      testID="VerificationDeniedIcon"
      width={60}
      height={60}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Circle cx={30} cy={30} r={30} fill="#F9F6F0" />
      <Circle cx={30} cy={30} r={11.25} stroke="#EA6042" strokeWidth={1.5} />
      <Path
        d="m34.5 25.5-9 9M34.5 34.5l-9-9"
        stroke="#EA6042"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default React.memo(VerificationDenied)
