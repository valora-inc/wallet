import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

function QuitIcon() {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <Path
        d="M13.9999 2.00146L1.99988 14.0015"
        stroke="#2E3338"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 2.00146L14 14.0015"
        stroke="#2E3338"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default React.memo(QuitIcon)
