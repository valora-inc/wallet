import { useEffect } from 'react'
import { startBalanceAutorefresh, stopBalanceAutorefresh } from 'src/home/actions'
import { useDispatch } from 'src/redux/hooks'

export default function useBalanceAutoRefresh() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(startBalanceAutorefresh())

    return () => {
      dispatch(stopBalanceAutorefresh())
    }
  }, [])
}
