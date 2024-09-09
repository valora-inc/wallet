import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  color: Colors
}

const QuickActionsSwapAndDeposit = ({ color }: Props) => (
  <Svg width={16} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="m6.55 16.2 5.175-6.2h-4l.725-5.675L3.825 11H7.3l-.75 5.2ZM4 20l1-7H0L9 0h2l-1 8h6L6 20H4Z"
      fill={color}
    />
  </Svg>
)

export default React.memo(QuickActionsSwapAndDeposit)
