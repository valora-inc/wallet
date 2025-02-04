import i18n from 'src/i18n'
import { setLanguage } from 'src/i18n/slice'
import { useDispatch } from 'src/redux/hooks'
import Logger from 'src/utils/Logger'

const TAG = 'i18n/actions'

export default function useChangeLanguage() {
  const dispatch = useDispatch()

  const handleChangeLanguage = async (language: string | null) => {
    dispatch(setLanguage(language))
    return i18n
      .changeLanguage(language || '')
      .catch((reason: any) => Logger.error(TAG, 'Failed to change i18n language', reason))
  }

  return handleChangeLanguage
}
