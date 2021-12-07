import * as React from 'react'
import Svg, { Path, Circle } from 'svgs'

function VerificationPending() {
  return (
    <Svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Circle cx="30" cy="30" r="30" fill="#F9F6F0" />
      <Path
        d="M30 22.5V30H36"
        stroke="#FFA500"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <Circle cx="30" cy="30" r="11.25" stroke="#FFA500" stroke-width="1.5" />
    </Svg>
  )
}

export default React.memo(VerificationPending)
