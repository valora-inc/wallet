import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

export interface Props {
  size?: number
  color?: Colors
  testID?: string
}

export default function DefaultToken({
  color = Colors.black,
  size = 32,
  testID = 'DefaultToken',
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none" testID={testID}>
      <Path
        d="M16 0C7.168 0 0 7.168 0 16C0 24.832 7.168 32 16 32C24.832 32 32 24.832 32 16C32 7.168 24.832 0 16 0ZM17.6 27.2H14.4V24H17.6V27.2ZM20.912 14.8L19.472 16.272C18.32 17.44 17.6 18.4 17.6 20.8H14.4V20C14.4 18.24 15.12 16.64 16.272 15.472L18.256 13.456C18.848 12.88 19.2 12.08 19.2 11.2C19.2 9.44 17.76 8 16 8C14.24 8 12.8 9.44 12.8 11.2H9.6C9.6 7.664 12.464 4.8 16 4.8C19.536 4.8 22.4 7.664 22.4 11.2C22.4 12.608 21.824 13.888 20.912 14.8Z"
        fill={color}
      />
    </Svg>
  )
}
