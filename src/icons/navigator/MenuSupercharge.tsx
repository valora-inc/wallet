import * as React from 'react'
import Svg, { G, Path } from 'react-native-svg'

export function MenuSupercharge() {
  return (
    <Svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <G>
        <Path
          d="M10.0242 14.5577L21.4384 3.16779C21.7427 2.86418 22.2505 3.16982 22.1246 3.58082L18.7312 14.6632C18.6776 14.838 18.7455 15.0272 18.8979 15.1281L22.151 17.2826C22.3801 17.4343 22.3997 17.7633 22.1903 17.9413L9.32107 28.8774C8.98983 29.1589 8.50459 28.8031 8.67345 28.4025L13.3522 17.304C13.436 17.1051 13.3525 16.8752 13.1606 16.7765L10.1271 15.217C9.87809 15.089 9.82607 14.7555 10.0242 14.5577Z"
          fill="#B4B9BD"
        />
      </G>
    </Svg>
  )
}

export default React.memo(MenuSupercharge)
