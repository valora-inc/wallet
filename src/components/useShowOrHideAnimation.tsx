import { useEffect } from 'react'
import Animated, { runOnJS, withTiming } from 'react-native-reanimated'

const SHOW_DURATION = 200
const HIDE_DURATION = 150
/**
 * - This hook will update the |progress| shared value when |showing| changes from true to
 * false (and viceversa) applying an ease in-out function.
 * - |progress| will be set to 1 when |showing| is true and 0 when |showing| is false.
 * - |onShow| will be called immediately when |showing| turns to true and |onHide| will be
 * called after the hiding animation finishes.
 */
export function useShowOrHideAnimation(
  progress: Animated.SharedValue<number>,
  showing: boolean,
  onShow: () => void,
  onHide: () => void
) {
  useEffect(() => {
    progress.value = withTiming(
      showing ? 1 : 0,
      { duration: showing ? SHOW_DURATION : HIDE_DURATION },
      (isFinished) => {
        if (isFinished && !showing) {
          runOnJS(onHide)()
        }
      }
    )
    if (showing) {
      onShow()
    }
  }, [showing])
}
