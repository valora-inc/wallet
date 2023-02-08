import { NativeModules } from 'react-native'

export const networkLoadBalancer =
  'http://mpcnetworkloadbalancer-348316826.us-west-1.elb.amazonaws.com'
export const userManagementServer =
  'http://usermanagementloadbalancer-461184073.us-west-1.elb.amazonaws.com/'
const { CapsuleSignerModule } = NativeModules

function init() {
  CapsuleSignerModule.setServerUrl(networkLoadBalancer)
}

init()
