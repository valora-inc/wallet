import * as React from 'react'
import { Path, Svg } from 'react-native-svg'
import Colors from 'src/styles/colors'

const GraphSparkle = () => (
  <Svg width={15} height={12} fill="none">
    <Path
      d="m5.313 4.625-.688-1.5-1.5-.688 1.5-.687.688-1.5L6 1.75l1.5.688-1.5.687-.688 1.5ZM9.375 6.5l-.594-1.281L7.5 4.625l1.281-.594.594-1.281.594 1.281 1.281.594-1.281.594L9.375 6.5ZM2.5 7.75l-.594-1.281-1.281-.594 1.281-.594L2.5 4l.594 1.281 1.281.594-1.281.594L2.5 7.75Zm.313 4.063-.938-.938 4.688-4.688 2.5 2.5L13.5 3.704l.875.875-5.313 5.984-2.5-2.5-3.75 3.75Z"
      fill={Colors.black}
    />
  </Svg>
)

export default React.memo(GraphSparkle)
