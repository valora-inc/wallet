import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  size?: number
}

const Clipboard = ({ size = 24 }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fill={Colors.black}
      d="M18.546 3.818h-3.8C14.364 2.764 13.364 2 12.181 2 11 2 10 2.764 9.618 3.818h-3.8c-1 0-1.818.818-1.818 1.818v14.546c0 1 .818 1.818 1.818 1.818h12.728c1 0 1.818-.818 1.818-1.818V5.636c0-1-.819-1.818-1.819-1.818Zm-6.364 0c.5 0 .909.41.909.91s-.41.908-.91.908-.908-.409-.908-.909.409-.909.909-.909Zm6.364 16.364H5.818V5.636h1.818v2.728h9.091V5.636h1.819v14.546Z"
    />
  </Svg>
)
export default Clipboard
