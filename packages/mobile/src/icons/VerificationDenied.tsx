import * as React from 'react'
import Svg, { Path, Circle } from 'svgs'

function VerificationDenied() {
  return (
    <Svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Circle cx="30" cy="30" r="30" fill="#F9F6F0" />
      <Circle cx="30" cy="30" r="11.25" stroke="#2E3338" stroke-width="1.5" />
      <Path
        d="M34.5 25.5L25.5 34.5"
        stroke="#2E3338"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Path
        d="M34.5 34.5L25.5 25.5"
        stroke="#2E3338"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </Svg>
  )
}

export default React.memo(VerificationDenied)
