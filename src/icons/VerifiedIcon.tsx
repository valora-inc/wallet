import * as React from 'react'
import colors from 'src/styles/colors'
import { Path, Svg } from 'svgs'

export interface Props {
  color?: string
  size?: number
}

export default function VerifiedIcon({ color = colors.greenBrand, size = 22 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/Svg"
    >
      <Path
        d="M22 11L19.56 8.21L19.9 4.52L16.29 3.7L14.4 0.5L11 1.96L7.6 0.5L5.71 3.69L2.1 4.5L2.44 8.2L0 11L2.44 13.79L2.1 17.49L5.71 18.31L7.6 21.5L11 20.03L14.4 21.49L16.29 18.3L19.9 17.48L19.56 13.79L22 11ZM8.38 15.01L6 12.61C5.9073 12.5175 5.83375 12.4076 5.78357 12.2866C5.73339 12.1657 5.70756 12.036 5.70756 11.905C5.70756 11.774 5.73339 11.6443 5.78357 11.5234C5.83375 11.4024 5.9073 11.2925 6 11.2L6.07 11.13C6.46 10.74 7.1 10.74 7.49 11.13L9.1 12.75L14.25 7.59C14.64 7.2 15.28 7.2 15.67 7.59L15.74 7.66C16.13 8.05 16.13 8.68 15.74 9.07L9.82 15.01C9.41 15.4 8.78 15.4 8.38 15.01Z"
        fill={color}
      />
    </Svg>
  )
}
