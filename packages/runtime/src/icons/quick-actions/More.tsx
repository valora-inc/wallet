import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  color: Colors
}

const QuickActionsMore = ({ color }: Props) => (
  <Svg width={25} height={24} viewBox="0 0 25 24" fill="none">
    <Path
      d="M4.83325 12C4.83325 11.1761 5.50939 10.5 6.33325 10.5C7.15711 10.5 7.83325 11.1761 7.83325 12C7.83325 12.8239 7.15711 13.5 6.33325 13.5C5.50939 13.5 4.83325 12.8239 4.83325 12ZM16.8333 12C16.8333 11.1761 17.5094 10.5 18.3333 10.5C19.1571 10.5 19.8333 11.1761 19.8333 12C19.8333 12.8239 19.1571 13.5 18.3333 13.5C17.5094 13.5 16.8333 12.8239 16.8333 12ZM10.8333 12C10.8333 11.1761 11.5094 10.5 12.3333 10.5C13.1571 10.5 13.8333 11.1761 13.8333 12C13.8333 12.8239 13.1571 13.5 12.3333 13.5C11.5094 13.5 10.8333 12.8239 10.8333 12Z"
      fill={color}
      stroke={color}
    />
  </Svg>
)

export default React.memo(QuickActionsMore)
