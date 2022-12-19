import React, { useEffect, useMemo, useState } from 'react'
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

  useEffect(() => {
    if (showToast) {
      setTimeout(() => {
        setShowToast(false)
      }, TOAST_DISMISS_TIMEOUT)
    }
  }, [showToast])

  const onPressFavoriteSuccessToast = () => {
    setShowToast(false)
    sectionListRef.current?.scrollToLocation({
      sectionIndex: 0,
      itemIndex: 0,
      animated: true,
      // TODO how to scroll to top of list header
      viewOffset: 2000,
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
        onPress={onPressFavoriteSuccessToast}
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
