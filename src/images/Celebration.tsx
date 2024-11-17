import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface Props {
  width?: number
  height?: number
  testID?: string
}

export default function Celebration({ width = 58, height = 53, testID }: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 58 53" fill="none" testID={testID}>
      <Path fill="#FD56B5" d="M11.617 22.922 1 52.267l30.61-10.395" />
      <Path
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.617 22.922 1 52.267l30.61-10.395"
      />
      <Path
        fill="#6E75EE"
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M27.69 26.477c5.654 5.464 8.058 12 5.373 14.598-.74.715-1.794 1.06-3.045 1.064-3.29.015-7.967-2.296-12.062-6.257-5.654-5.464-8.058-12-5.373-14.598 2.688-2.598 9.452-.276 15.106 5.193Z"
      />
      <Path
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.148 32.76s8.669-9.555 9.322-18.02M17.952 35.882S37.232 18.483 40.12 6.066M21.187 38.592s15.388-12.395 30.899-11.966M30.719 12.173l1.853-3.9M50.3 20.645l4.411-.474M18.895 14.74l.003-1.205M34.445 25.46l.919-.816M38.931 43.845l1.212.284M25.175 9.514c-3.54-1.826-2.253-4.24-.123-4.367 3.251-.19 3.338-4.909-3.318-4.04M41.038 20.955c-1.644-3.28-.523-5.51 2.257-5.296 2.97.23 7.484 2.323 7.013-3.038-.539-6.13 3.385-6.7 6.692-5.063M41.065 36.892c1.382-3.168 4.289-2.77 5.295-.076 1.005 2.694 4.803 3.838 6.7-.402"
      />
    </Svg>
  )
}
