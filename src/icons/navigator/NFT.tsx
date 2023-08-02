import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export function NFT() {
  return (
    <Svg width={32} height={32} fill="none">
      <Path
        d="M8 24H22V26H8C6.9 26 6 25.1 6 24V10H8V24ZM26 8V20C26 21.1 25.1 22 24 22H12C10.9 22 10 21.1 10 20V8C10 6.9 10.9 6 12 6H24C25.1 6 26 6.9 26 8ZM24 8H12V20H24V8ZM22 10H17V17L19.5 15.5L22 17V10Z"
        fill="#B4B9BD"
      />
    </Svg>
  )
}

export default React.memo(NFT)
