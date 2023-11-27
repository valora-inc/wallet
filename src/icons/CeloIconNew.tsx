import * as React from 'react'
import { Path, Svg } from 'react-native-svg'
import Colors from 'src/styles/colors'

const CeloIconNew = () => (
  <Svg width={10} height={10} fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9.5.5h-9v9.058h9V6.396H8.006a3.298 3.298 0 0 1-3 1.957c-1.828 0-3.309-1.503-3.309-3.33a3.316 3.316 0 0 1 3.31-3.318c1.351 0 2.51.83 3.025 2.009H9.5V.5Z"
      fill={Colors.black}
    />
  </Svg>
)

export default React.memo(CeloIconNew)
