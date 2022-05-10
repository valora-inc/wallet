import { SetStateAction, useEffect, useRef, useState } from 'react'

type Callback<S> = ((state?: S) => void) | undefined
type DispatchWithCallback<A> = (value: A, callback: Callback<A>) => void

/**
 * useState which allows you to pass a callback to setState, called when the value has been rendered
 */
export default function useStateWithCallback<S>(
  initialValue: S
): [S, DispatchWithCallback<SetStateAction<S>>] {
  const callbackRef = useRef<Callback<S> | null>(null)
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (callbackRef.current) {
      callbackRef.current(value)
      callbackRef.current = null
    }
  }, [value])

  const setValueWithCallback: DispatchWithCallback<SetStateAction<S>> = (newValue, callback) => {
    callbackRef.current = callback

    return setValue(newValue)
  }

  return [value, setValueWithCallback]
}
