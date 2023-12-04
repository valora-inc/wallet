import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
}

function Edit({ size = 13, color = colors.successDark }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 13 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <Path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M10.8667 4.94998L8.03333 2.14998L8.96667 1.21665C9.22222 0.961091 9.53622 0.833313 9.90867 0.833313C10.2807 0.833313 10.5944 0.961091 10.85 1.21665L11.7833 2.14998C12.0389 2.40554 12.1722 2.71398 12.1833 3.07531C12.1944 3.4362 12.0722 3.74442 11.8167 3.99998L10.8667 4.94998ZM9.9 5.93331L2.83333 13H0V10.1666L7.06667 3.09998L9.9 5.93331Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(Edit)
