import * as React from 'react'
import { Path, Svg } from 'react-native-svg'
import Colors from 'src/styles/colors'

const ProfilePlus = () => (
  <Svg width={16} height={12} fill="none">
    <Path
      d="M10 .667A2.667 2.667 0 1 0 10 6a2.667 2.667 0 0 0 0-5.333Zm0 1.266a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Zm-7.333.734v2h-2V6h2v2H4V6h2V4.667H4v-2H2.667Zm7.333 4c-1.78 0-5.333.886-5.333 2.666v2h10.666v-2c0-1.78-3.553-2.666-5.333-2.666Zm0 1.266c1.98 0 4.067.974 4.067 1.4v.734H5.933v-.734c0-.426 2.067-1.4 4.067-1.4Z"
      fill={Colors.black}
    />
  </Svg>
)

export default React.memo(ProfilePlus)
