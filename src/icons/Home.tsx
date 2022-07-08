import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export function Home() {
  return (
    <Svg testID="Home" width={32} height={32} fill="none">
      <Path
        d="M18.15 25.294c.966-7.525 4.503-11.809 9.85-15.691L25.266 6c-3.497 2.682-7.316 6.485-9.085 11.729C14.734 13.445 11.719 9.683 6.854 6L4 9.683c6.07 4.323 9.126 9.166 9.97 15.611h4.18Z"
        fill="#B4B9BD"
      />
    </Svg>
  )
}

export default React.memo(Home)
