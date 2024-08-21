import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const Star = () => (
  <Svg width={24} height={24} fill="none">
    <Path
      d="m22.026 9.18-7.379-.636-2.884-6.794L8.88 8.554 1.5 9.181l5.604 4.854L5.42 21.25l6.342-3.828 6.343 3.828-1.673-7.215 5.593-4.854Zm-10.263 6.323-3.859 2.33 1.027-4.393-3.408-2.956 4.495-.39 1.745-4.136 1.755 4.146 4.495.39-3.407 2.956 1.026 4.393-3.869-2.34Z"
      fill={Colors.gray3}
    />
  </Svg>
)

export default Star
