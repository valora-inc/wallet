import * as React from 'react'
import Svg, { Path, Circle } from 'svgs'

function VerificationComplete() {
  return (
    <Svg
      testID="VerificationCompleteIcon"
      width={60}
      height={60}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Circle cx={30} cy={30} r={30} fill="#F9F6F0" />
      <Path
        d="M24.776 30.131a.75.75 0 0 0-1.052 1.069l1.052-1.069Zm3.14 4.144-.526.534a.75.75 0 0 0 1.042.011l-.515-.545Zm8.85-7.33a.75.75 0 1 0-1.031-1.09l1.03 1.09ZM23.723 31.2l3.666 3.61 1.053-1.07-3.667-3.609-1.052 1.069Zm4.708 3.62 8.333-7.875-1.03-1.09L27.4 33.73l1.03 1.09Z"
        fill="#1AB775"
      />
      <Path
        d="M30 40.5c-5.799 0-10.5-4.701-10.5-10.5h-3c0 7.456 6.044 13.5 13.5 13.5v-3ZM40.5 30c0 5.799-4.701 10.5-10.5 10.5v3c7.456 0 13.5-6.044 13.5-13.5h-3ZM30 19.5c5.799 0 10.5 4.701 10.5 10.5h3c0-7.456-6.044-13.5-13.5-13.5v3Zm0-3c-7.456 0-13.5 6.044-13.5 13.5h3c0-5.799 4.701-10.5 10.5-10.5v-3Z"
        fill="#1AB775"
      />
    </Svg>
  )
}

export default React.memo(VerificationComplete)
