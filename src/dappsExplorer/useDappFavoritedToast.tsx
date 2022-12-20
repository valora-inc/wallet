import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList } from 'react-native'
import ToastWithCTA from 'src/components/ToastWithCTA'
import { Dapp } from 'src/dapps/types'

const TOAST_DISMISS_TIMEOUT = 5000

const useDappFavoritedToast = (sectionListRef: React.RefObject<SectionList>) => {
  const { t } = useTranslation()

  // do not use favoritedDapp to show / hide the toast, as the content of the toast depends on the dapp name during transitions
  const [favoritedDapp, setFavoritedDapp] = useState<Dapp | null>(null)
  const [showToast, setShowToast] = useState(false)

  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }

    // ensure that favoriting a new dapp within the TOAST_DISMISS_TIMEOUT of the
    // previous one launches a new toast that stays for the full timeout
    // duration
    timeoutIdRef.current = setTimeout(onResetToast, TOAST_DISMISS_TIMEOUT)
  }, [favoritedDapp])

  const onResetToast = () => {
    setShowToast(false)
    timeoutIdRef.current = null
  }

  const onPressToast = () => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    onResetToast()

    sectionListRef.current?.scrollToLocation({
      sectionIndex: 0,
      itemIndex: 0,
      animated: true,
    })
  }

  const onFavoriteDapp = (dapp: Dapp) => {
    setFavoritedDapp(dapp)
    setShowToast(true)
  }

  const DappFavoritedToast = useMemo(
    () => (
      <ToastWithCTA
        showToast={showToast}
        title={favoritedDapp?.name}
        message={t('dappsScreen.favoritedDappToast.message')}
        labelCTA={t('dappsScreen.favoritedDappToast.labelCTA')}
        onPress={onPressToast}
      />
    ),
    [favoritedDapp, showToast]
  )

  return {
    onFavoriteDapp,
    DappFavoritedToast,
  }
}

export default useDappFavoritedToast
