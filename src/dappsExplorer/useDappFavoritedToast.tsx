import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList } from 'react-native'
import { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import { Dapp } from 'src/dapps/types'

const TOAST_DISMISS_TIMEOUT = 5000

const useDappFavoritedToast = (sectionListRef: React.RefObject<SectionList>) => {
  const { t } = useTranslation()

  // do not use favoritedDapp to show / hide the toast, as the content of the toast depends on the dapp name during transitions
  const [favoritedDapp, setFavoritedDapp] = useState<Dapp | null>(null)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setShowToast(false), TOAST_DISMISS_TIMEOUT)
    return () => {
      clearTimeout(timeout)
    }
  }, [favoritedDapp])

  const onPressToast = () => {
    setShowToast(false)
    sectionListRef.current?.getScrollResponder()?.scrollTo({ y: 0, animated: true })
  }

  const onFavoriteDapp = (dapp: Dapp) => {
    setFavoritedDapp(dapp)
    setShowToast(true)
  }

  const DappFavoritedToast = useMemo(
    () => (
      <Toast
        showToast={showToast}
        variant={NotificationVariant.Info}
        hideIcon
        title={favoritedDapp?.name}
        description={t('dappsScreen.favoritedDappToast.message')}
        ctaLabel={t('dappsScreen.favoritedDappToast.labelCTA')}
        onPressCta={onPressToast}
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
