import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'

const NftSentIcon = () => (
  <Svg width={40} height={40}>
    <Circle cx={20} cy={20} r={20} fill="#ECE6F7" testID="NftSentIcon" />
    <Path
      d="M20 31c-6.069 0-11-4.931-11-11S13.931 9 20 9s11 4.931 11 11-4.931 11-11 11Zm0-19.977A8.979 8.979 0 0 0 11.023 20 8.979 8.979 0 0 0 20 28.977 8.98 8.98 0 0 0 28.977 20 8.98 8.98 0 0 0 20 11.023Z"
      fill="#452C75"
    />
    <Path
      d="M20.106 13c-3.894 0-7.055 3.11-7.106 6.98h14.212C27.16 16.11 24 13 20.105 13Z"
      fill="#452C75"
    />
  </Svg>
)

export default NftSentIcon
