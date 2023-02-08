import { useDispatch, useSelector } from 'react-redux'
import { createUser, verifyEmail } from 'src/capsule/helpers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { initiateCapsuleAuth } from 'src/web3/actions'
import { capsuleAccountSelector } from 'src/web3/selectors'

const TAG = 'useCapsule'

export const useCapsule = () => {
  const dispatch = useDispatch()
  const capsuleAccountId = useSelector(capsuleAccountSelector)

  const authenticateWithCapsule = async (email: string): Promise<void> => {
    Logger.debug(TAG, '@authenticateWithCapsule', 'Initiate auth', email)
    try {
      const { userId } = await createUser({ email })
      if (userId) {
        Logger.debug(TAG, '@authenticateWithCapsule', 'User Id', userId)
        dispatch(initiateCapsuleAuth(userId, false))
        navigate(Screens.CapsuleEmailVerification)
      }
    } catch (error) {
      Logger.error(TAG, '@authenticateWithCapsule', error as any)
    }
  }

  const verifyWithCapsule = async (code: string): Promise<void> => {
    Logger.debug(TAG, '@verifyWithCapsule', 'Payload', JSON.stringify({ capsuleAccountId, code }))
    try {
      if (capsuleAccountId) {
        const response = await verifyEmail(capsuleAccountId, { verificationCode: code })
        Logger.debug(TAG, '@verifyWithCapsule', 'response', JSON.stringify(response))
        dispatch(initiateCapsuleAuth(capsuleAccountId, true))
        // navigate(Screens.NameAndPicture)
      }
    } catch (error) {
      Logger.error(TAG, '@verifyWithCapsule', error as any)
    }
  }

  return { authenticateWithCapsule, verifyWithCapsule }
}
