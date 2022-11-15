import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export function AddWithdraw() {
  return (
    <Svg testID="add-and-withdraw" width={32} height={32} viewBox="0 0 32 32" fill="none">
      <Path
        d="M10.263 11.263c2.907 0 5.263-1.178 5.263-2.631C15.526 7.178 13.17 6 10.263 6S5 7.178 5 8.632c0 1.453 2.356 2.631 5.263 2.631Z"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 8.632v3.684c0 1.453 2.356 2.631 5.263 2.631s5.263-1.178 5.263-2.631V8.632"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 12.316V16c0 1.453 2.356 2.631 5.263 2.631s5.263-1.178 5.263-2.631v-3.684"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 16v3.684c0 1.453 2.356 2.632 5.263 2.632s5.263-1.178 5.263-2.632V16"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 19.684v3.684C5 24.822 7.356 26 10.263 26s5.263-1.178 5.263-2.632v-3.684M20.79 18.632c2.906 0 5.263-1.179 5.263-2.632s-2.357-2.632-5.264-2.632c-2.906 0-5.263 1.179-5.263 2.632s2.357 2.632 5.264 2.632Z"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.526 16v3.684c0 1.453 2.357 2.632 5.264 2.632 2.906 0 5.263-1.178 5.263-2.632V16"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.526 19.684v3.684c0 1.454 2.357 2.632 5.264 2.632 2.906 0 5.263-1.178 5.263-2.632v-3.684"
        stroke="#B4B9BD"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export default React.memo(AddWithdraw)
