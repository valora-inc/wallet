import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export function Face() {
  return (
    <Svg testID="FaceBiometryIcon" width={64} height={64} fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 57.887c14.297 0 25.887-11.59 25.887-25.887S46.297 6.113 32 6.113 6.113 17.703 6.113 32 17.703 57.887 32 57.887ZM32 60c15.464 0 28-12.536 28-28S47.464 4 32 4 4 16.536 4 32s12.536 28 28 28Z"
        fill="#1A73E8"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36.752 46.831c.27.582.018 1.274-.565 1.544-2.69 1.25-5.356 1.479-7.54.476-2.215-1.017-3.66-3.173-4.134-6.099l2.295-.372c.383 2.364 1.466 3.742 2.809 4.359 1.374.63 3.299.592 5.591-.472a1.162 1.162 0 0 1 1.544.564ZM33.585 35.17v-4.755h2.113v6.868h-5.811V35.17h3.698Z"
        fill="#1A73E8"
      />
      <Path
        d="M46.792 25.132a2.113 2.113 0 1 1-4.226 0 2.113 2.113 0 0 1 4.226 0ZM21.434 25.132a2.113 2.113 0 1 1-4.226 0 2.113 2.113 0 0 1 4.226 0Z"
        fill="#1A73E8"
      />
    </Svg>
  )
}

export default React.memo(Face)
