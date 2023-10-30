import * as React from 'react'
import { Path, Rect, Svg } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  size?: number
  color?: Colors
  backgroundColor?: Colors
}

const AlertWithBackground = ({ size = 40, color = Colors.errorDark, backgroundColor }: Props) => {
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {backgroundColor && <Rect width={size} height={size} fill={backgroundColor} rx={size} />}
      <Path
        translateX={(size - 24) / 2}
        translateY={(size - 24) / 2}
        d="M11.1 14.7H12.9V16.5H11.1V14.7ZM11.1 7.5H12.9V12.9H11.1V7.5ZM12 3C7.023 3 3 7.05 3 12C3 14.3869 3.94821 16.6761 5.63604 18.364C6.47177 19.1997 7.46392 19.8626 8.55585 20.3149C9.64778 20.7672 10.8181 21 12 21C14.3869 21 16.6761 20.0518 18.364 18.364C20.0518 16.6761 21 14.3869 21 12C21 10.8181 20.7672 9.64778 20.3149 8.55585C19.8626 7.46392 19.1997 6.47177 18.364 5.63604C17.5282 4.80031 16.5361 4.13738 15.4442 3.68508C14.3522 3.23279 13.1819 3 12 3ZM12 19.2C10.0904 19.2 8.25909 18.4414 6.90883 17.0912C5.55857 15.7409 4.8 13.9096 4.8 12C4.8 10.0904 5.55857 8.25909 6.90883 6.90883C8.25909 5.55857 10.0904 4.8 12 4.8C13.9096 4.8 15.7409 5.55857 17.0912 6.90883C18.4414 8.25909 19.2 10.0904 19.2 12C19.2 13.9096 18.4414 15.7409 17.0912 17.0912C15.7409 18.4414 13.9096 19.2 12 19.2Z"
        fill={color}
      />
    </Svg>
  )
}

export default React.memo(AlertWithBackground)
