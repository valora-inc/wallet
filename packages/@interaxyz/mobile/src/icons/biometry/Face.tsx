import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

export function Face() {
  return (
    <Svg testID="FaceBiometryIcon" width={24} height={24} fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 21.707c5.361 0 9.707-4.346 9.707-9.707 0-5.361-4.346-9.708-9.707-9.708-5.361 0-9.708 4.347-9.708 9.708S6.64 21.707 12 21.707Zm0 .793c5.799 0 10.5-4.701 10.5-10.5S17.799 1.5 12 1.5 1.5 6.201 1.5 12 6.201 22.5 12 22.5Z"
        fill={Colors.white}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.782 17.562a.436.436 0 0 1-.212.579c-1.009.468-2.008.554-2.827.178-.831-.381-1.373-1.19-1.55-2.287l.86-.14c.144.887.55 1.404 1.053 1.635.516.236 1.237.222 2.097-.177a.436.436 0 0 1 .58.212ZM12.594 13.189v-1.783h.793v2.575h-2.18v-.792h1.387Z"
        fill={Colors.white}
      />
      <Path
        d="M17.547 9.425a.792.792 0 1 1-1.585 0 .792.792 0 0 1 1.585 0ZM8.038 9.425a.792.792 0 1 1-1.585 0 .792.792 0 0 1 1.585 0Z"
        fill={Colors.white}
      />
    </Svg>
  )
}

export default React.memo(Face)
