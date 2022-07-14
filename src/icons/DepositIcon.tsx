import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

const DepositIcon = () => (
  <Svg width={40} height={40} fill="none">
    <Path d="M0 20C0 8.954 8.954 0 20 0s20 8.954 20 20-8.954 20-20 20S0 31.046 0 20Z" fill="#fff" />
    <Path
      d="M40 20c0 11.046-8.954 20-20 20S0 31.046 0 20 8.954 0 20 0s20 8.954 20 20Z"
      fill="#F8F9F9"
    />
    <Path
      d="M27.07 17.93a.996.996 0 0 0-1.41 0L21 22.59V10c0-.55-.45-1-1-1s-1 .45-1 1v12.59l-4.66-4.66a.996.996 0 1 0-1.41 1.41l6.36 6.36c.39.39 1.02.39 1.41 0l6.36-6.36c.4-.39.4-1.02.01-1.41ZM30 29H10v2h20v-2Z"
      fill="#2E3338"
    />
  </Svg>
)

export default DepositIcon
