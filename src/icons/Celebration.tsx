import * as React from 'react'
import Colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

interface Props {
  size?: number
  color?: string
}

const Celebration = ({ size = 24, color = Colors.black }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fill={color}
      d="M0 21 5 7l9 9-14 5Zm3.3-3.3 7.05-2.5-4.55-4.55-2.5 7.05Zm9.25-6.15L11.5 10.5l5.6-5.6a2.624 2.624 0 0 1 1.925-.8c.75 0 1.392.267 1.925.8l.6.6-1.05 1.05-.6-.6a1.187 1.187 0 0 0-.875-.35c-.35 0-.642.117-.875.35l-5.6 5.6Zm-4-4L7.5 6.5l.6-.6c.233-.233.35-.517.35-.85 0-.333-.117-.617-.35-.85l-.65-.65L8.5 2.5l.65.65c.533.533.8 1.167.8 1.9 0 .733-.267 1.367-.8 1.9l-.6.6Zm2 2L9.5 8.5l3.6-3.6c.233-.233.35-.525.35-.875s-.117-.642-.35-.875l-1.6-1.6L12.55.5l1.6 1.6c.533.533.8 1.175.8 1.925s-.267 1.392-.8 1.925l-3.6 3.6Zm4 4L13.5 12.5l1.6-1.6a2.624 2.624 0 0 1 1.925-.8c.75 0 1.392.267 1.925.8l1.6 1.6-1.05 1.05-1.6-1.6a1.187 1.187 0 0 0-.875-.35c-.35 0-.642.117-.875.35l-1.6 1.6Z"
    />
  </Svg>
)
export default Celebration
