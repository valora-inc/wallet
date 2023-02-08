import Client from '@capsule/client/client'
import { userManagementServer } from './config'

const userManagementClient = new Client({
  userManagementHost: userManagementServer,
})

export default userManagementClient
