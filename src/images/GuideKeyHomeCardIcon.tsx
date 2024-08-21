import * as React from 'react'
import Svg, { Ellipse, Path } from 'svgs'

interface Props {
  height?: number
  width?: number
}

export default class GuideKeyIcon extends React.PureComponent<Props> {
  static defaultProps = {
    height: 86,
    width: 92,
  }

  render() {
    return (
      <Svg width={this.props.width} height={this.props.height} fill="none" viewBox="0 0 92 86">
        <Path
          d="M55.21 45.03H43.809m-7.602 6.923v-6.922h7.602m0 0v6.922"
          stroke="#2E3338"
          strokeWidth={2}
        />
        <Ellipse cx={59.846} cy={45.03} rx={4.635} ry={4.615} stroke="#2E3338" strokeWidth={2} />
        <Path
          d="M51.31 9.975C32.23 9.123 12.923 18.71.555 35.59.555 12.447 27.2-.95 49.688.053c22.486 1.004 42.651 17.855 41.948 33.46C79.3 19.364 70.389 10.827 51.31 9.974Z"
          fill="#FFE768"
          style={{
            mixBlendMode: 'multiply',
          }}
        />
        <Path
          d="M44.094 74.222c18.46 4.876 30.448-.389 46.14-14.26-9.533 17.387-29.03 29.826-50.787 24.08-21.756-5.747-30.592-27.23-22.944-44.767 2.318 14.306 9.13 30.071 27.59 34.947Z"
          fill="#42D689"
          style={{
            mixBlendMode: 'multiply',
          }}
        />
        <Path
          d="M20.831 34.857c-6.733 14.522-3.984 31.144 4.585 46.605C9.704 73.626 4.652 50.175 12.586 33.06c7.936-17.115 29.068-23.775 40.862-17.893l-.043.009c-11.618 2.327-25.85 5.177-32.574 19.681Z"
          fill="#FF6F43"
          style={{
            mixBlendMode: 'multiply',
          }}
        />
        <Path
          d="M78.36 44.298c.798-16.3-5.86-29.026-20.368-39.65 17.916.869 30.129 17.227 30.129 39.65s-21.78 36.46-35.228 35.807C66.617 72.58 77.563 60.6 78.36 44.298Z"
          fill="#92D8FF"
          style={{
            mixBlendMode: 'multiply',
          }}
        />
      </Svg>
    )
  }
}
