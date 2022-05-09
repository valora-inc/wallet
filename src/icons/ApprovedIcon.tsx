import * as React from 'react'
import colors from 'src/styles/colors'
import Svg, { Circle, Path } from 'svgs'

interface Props {
  size?: number
  color?: colors
}

function ApprovedIcon({ color = colors.greenUI }: Props) {
  return (
    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <Path
        d="M4.51296 8.16118C4.21077 7.87788 3.73614 7.89319 3.45285 8.19538C3.16955 8.49756 3.18486 8.97219 3.48704 9.25549L4.51296 8.16118ZM6.44444 11L5.93149 11.5472C6.2157 11.8136 6.6566 11.8181 6.94617 11.5575L6.44444 11ZM12.5017 6.55747C12.8096 6.28038 12.8346 5.80616 12.5575 5.49828C12.2804 5.19039 11.8062 5.16544 11.4983 5.44253L12.5017 6.55747ZM3.48704 9.25549L5.93149 11.5472L6.9574 10.4528L4.51296 8.16118L3.48704 9.25549ZM6.94617 11.5575L12.5017 6.55747L11.4983 5.44253L5.94272 10.4425L6.94617 11.5575Z"
        fill={color}
      />
      <Circle cx="8" cy="8" r="7.25" stroke={color} strokeWidth="1.5" />
    </Svg>
  )
}

export default React.memo(ApprovedIcon)
