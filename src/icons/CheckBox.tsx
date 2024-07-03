import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

type Props = {
  checked: boolean
  testID?: string
  checkedColor?: Colors
  uncheckedColor?: Colors
}

const CheckBox = ({
  checked,
  testID,
  checkedColor = Colors.primary,
  uncheckedColor = Colors.gray3,
}: Props) => {
  if (checked)
    return (
      <Svg testID={`${testID}/checked`} width={18} height={18} fill="none">
        <Path
          d="M16 0H2C.9 0 0 .9 0 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2Zm0 16H2V2h14v14ZM14.99 6l-1.41-1.42-6.59 6.59L4.41 8.6l-1.42 1.41 4 3.99 8-8Z"
          fill={checkedColor}
        />
      </Svg>
    )
  return (
    <Svg testID={`${testID}/unchecked`} width={18} height={18} fill="none">
      <Path
        d="M16 2v14H2V2h14Zm0-2H2C.9 0 0 .9 0 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2Z"
        fill={uncheckedColor}
      />
    </Svg>
  )
}

export default CheckBox
