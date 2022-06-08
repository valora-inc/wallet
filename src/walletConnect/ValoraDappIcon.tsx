import * as React from 'react'
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg'

const ValoraDappIcon = ({ size = 60 }) => (
  <Svg width={size} height={size} fill="none">
    <G>
      <Rect width={size} height={size} rx={size / 2} fill="#F8F9F9" />
      <G>
        <Path
          d="M31.792 38.078c.804-6.27 3.752-9.84 8.208-13.076L37.722 22c-2.915 2.235-6.097 5.404-7.571 9.774-1.206-3.57-3.719-6.705-7.772-9.774L20 25.069c5.059 3.603 7.605 7.639 8.308 13.01h3.484Z"
          fill="url(#b)"
        />
      </G>
    </G>
    <Defs>
      <LinearGradient
        id="b"
        x1={43.753}
        y1={25.541}
        x2={39.703}
        y2={40.868}
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset={0.118} stopColor="#35D07F" />
        <Stop offset={0.802} stopColor="#FBCC5C" />
      </LinearGradient>
    </Defs>
  </Svg>
)

export default ValoraDappIcon
