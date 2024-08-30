import * as React from 'react'
import Svg, { Ellipse, Path } from 'svgs'

interface Props {
  height?: number
  width?: number
}

export default class GuideKeyIcon extends React.PureComponent<Props> {
  static defaultProps = {
    height: 115,
    width: 154,
  }

  render() {
    return (
      <Svg width={this.props.width} height={this.props.height} viewBox="0 0 154 115" fill="none">
        <Path
          d="M85.88 60.094H71.31m-9.713 8.846v-8.846h9.713m0 0v8.846"
          stroke="#2E3338"
          strokeWidth={2}
        />
        <Ellipse cx={91.803} cy={60.094} rx={5.923} ry={5.897} stroke="#2E3338" strokeWidth={2} />
        <Path
          d="M80.896 15.302c-24.38-1.09-49.05 11.16-64.854 32.729 0-29.571 34.048-46.692 62.78-45.408 28.733 1.283 54.5 22.815 53.601 42.754-15.761-18.078-27.148-28.986-51.527-30.075Z"
          fill="#FFE768"
          style={{
            mixBlendMode: 'multiply',
          }}
        />
        <Path
          d="M71.675 97.395c23.588 6.231 38.906-.497 58.958-18.222-12.183 22.218-37.095 38.111-64.895 30.769-27.8-7.343-39.09-34.793-29.318-57.202 2.962 18.28 11.667 38.425 35.255 44.655Z"
          fill="#42D689"
          style={{
            mixBlendMode: 'multiply',
          }}
        />
        <Path
          d="M41.95 47.095c-8.603 18.556-5.09 39.795 5.859 59.551-20.077-10.012-26.532-39.977-16.393-61.847 10.14-21.87 37.142-30.378 52.212-22.863l-.056.011c-14.845 2.973-33.03 6.616-41.622 25.148Z"
          fill="#FF6F43"
          style={{
            mixBlendMode: 'multiply',
          }}
        />
        <Path
          d="M115.46 59.159c1.019-20.829-7.488-37.09-26.026-50.664 22.892 1.11 38.498 22.012 38.498 50.664s-27.83 46.586-45.013 45.753c17.536-9.616 31.523-24.925 32.541-45.753Z"
          fill="#92D8FF"
          style={{
            mixBlendMode: 'multiply',
          }}
        />
      </Svg>
    )
  }
}
