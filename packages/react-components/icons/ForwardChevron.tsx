import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import Svg, { Path } from 'svgs'

interface Props {
  height?: number
  color?: string
}

function ForwardChevron({ color, height }: Props) {
  return (
    <Svg
      height={height}
      width={height}
      viewBox="0 0 8 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      testID="BackChevron"
    >
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M.293.293a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414-1.414L5.586 7 .293 1.707a1 1 0 0 1 0-1.414Z"
        fill={color}
      />
    </Svg>
  )
}

ForwardChevron.defaultProps = {
  height: 16,
  color: colors.dark,
}

export default ForwardChevron
