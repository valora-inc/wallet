import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const NftReceivedIcon = () => (
  <Svg width={40} height={40} testID="NftReceivedIcon">
    <Circle cx={20} cy={20} r={20} fill={Colors.nftTxFeedIconBackground} />
    <Path
      d="M20 31c-6.069 0-11-4.931-11-11S13.931 9 20 9s11 4.931 11 11-4.931 11-11 11Zm0-19.977A8.979 8.979 0 0 0 11.023 20 8.979 8.979 0 0 0 20 28.977 8.98 8.98 0 0 0 28.977 20 8.98 8.98 0 0 0 20 11.023Z"
      fill={Colors.nftTxFeedIconForeground}
    />
    <Path
      d="M20.106 26.98c3.894 0 7.055-3.11 7.105-6.98H13c.05 3.869 3.211 6.98 7.106 6.98Z"
      fill={Colors.nftTxFeedIconForeground}
    />
  </Svg>
)

export default NftReceivedIcon
