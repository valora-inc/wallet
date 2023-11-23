import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

export interface Props {
  size?: number
  color?: Colors
}

function EyeIcon({ color, size }: Props) {
  return (
    <Svg height={size} width={size} viewBox="0 0 24 24" fill="none" testID="EyeIcon">
      <Path
        fill={color}
        stroke={color}
        d="m19.665 12.356.108-.22-.108-.22A8.494 8.494 0 0 0 12 7.136a8.494 8.494 0 0 0-7.665 4.78l-.108.22.108.22A8.485 8.485 0 0 0 12 17.136a8.485 8.485 0 0 0 7.665-4.78Zm-16.125-.22C4.928 8.826 8.192 6.5 12 6.5c3.808 0 7.072 2.326 8.46 5.636-1.388 3.311-4.652 5.637-8.46 5.637-3.808 0-7.072-2.326-8.46-5.637Zm11.006 0a2.546 2.546 0 1 0-5.093.002 2.546 2.546 0 0 0 5.093-.002Zm-5.728 0A3.187 3.187 0 0 1 12 8.955a3.187 3.187 0 0 1 3.182 3.181A3.187 3.187 0 0 1 12 15.318a3.187 3.187 0 0 1-3.182-3.182Z"
      />
    </Svg>
  )
}

EyeIcon.defaultProps = {
  size: 24,
  color: Colors.black,
}

export default EyeIcon
