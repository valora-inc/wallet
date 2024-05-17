import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import colors from 'src/styles/colors'

interface Props {
  color?: string
  testID?: string
  size?: number
}

function UpwardGraph({ color = colors.primary, testID = 'UpwardGraph', size = 16 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none" testID={testID}>
      <Path
        d="M6.09245 7.91311L2.846 11.1596L2.70687 11.0204L6.44624 7.27601L8.49245 9.32222L8.846 9.67577L9.19955 9.32222L12.1276 6.39422L12.4811 6.04066L12.1276 5.68711L11.6071 5.16666H13.5V7.05956L12.9796 6.53911L12.6263 6.18584L12.2727 6.53883L8.84628 9.95984L6.79955 7.91311L6.446 7.55956L6.09245 7.91311Z"
        fill={color}
        stroke={color}
      />
    </Svg>
  )
}

export default React.memo(UpwardGraph)
