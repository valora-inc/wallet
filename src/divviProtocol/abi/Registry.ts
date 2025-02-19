export const registryContractAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint48',
        name: 'transferDelay',
        type: 'uint48',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'AccessControlBadConfirmation',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint48',
        name: 'schedule',
        type: 'uint48',
      },
    ],
    name: 'AccessControlEnforcedDefaultAdminDelay',
    type: 'error',
  },
  {
    inputs: [],
    name: 'AccessControlEnforcedDefaultAdminRules',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'defaultAdmin',
        type: 'address',
      },
    ],
    name: 'AccessControlInvalidDefaultAdmin',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'neededRole',
        type: 'bytes32',
      },
    ],
    name: 'AccessControlUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'protocolId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
    ],
    name: 'ReferrerNotRegistered',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint8',
        name: 'bits',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'SafeCastOverflowedUintDowncast',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'protocolId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'userAddress',
        type: 'address',
      },
    ],
    name: 'UserAlreadyRegistered',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'DefaultAdminDelayChangeCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint48',
        name: 'newDelay',
        type: 'uint48',
      },
      {
        indexed: false,
        internalType: 'uint48',
        name: 'effectSchedule',
        type: 'uint48',
      },
    ],
    name: 'DefaultAdminDelayChangeScheduled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'DefaultAdminTransferCanceled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint48',
        name: 'acceptSchedule',
        type: 'uint48',
      },
    ],
    name: 'DefaultAdminTransferScheduled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'protocolId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'userAddress',
        type: 'address',
      },
    ],
    name: 'ReferralRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32[]',
        name: 'protocolIds',
        type: 'bytes32[]',
      },
      {
        indexed: false,
        internalType: 'uint256[]',
        name: 'rewardRates',
        type: 'uint256[]',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'rewardAddress',
        type: 'address',
      },
    ],
    name: 'ReferrerRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'previousAdminRole',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'newAdminRole',
        type: 'bytes32',
      },
    ],
    name: 'RoleAdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleGranted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
    ],
    name: 'RoleRevoked',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'acceptDefaultAdminTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'beginDefaultAdminTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'cancelDefaultAdminTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint48',
        name: 'newDelay',
        type: 'uint48',
      },
    ],
    name: 'changeDefaultAdminDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'defaultAdmin',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'defaultAdminDelay',
    outputs: [
      {
        internalType: 'uint48',
        name: '',
        type: 'uint48',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'defaultAdminDelayIncreaseWait',
    outputs: [
      {
        internalType: 'uint48',
        name: '',
        type: 'uint48',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'providerId',
        type: 'bytes32',
      },
    ],
    name: 'getProtocols',
    outputs: [
      {
        internalType: 'bytes32[]',
        name: '',
        type: 'bytes32[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'protocolId',
        type: 'bytes32',
      },
    ],
    name: 'getReferrers',
    outputs: [
      {
        internalType: 'bytes32[]',
        name: '',
        type: 'bytes32[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
    ],
    name: 'getRewardAddress',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'protocolId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
    ],
    name: 'getRewardRate',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
    ],
    name: 'getRoleAdmin',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'protocolId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
    ],
    name: 'getUsers',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'hasRole',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'userAddress',
        type: 'address',
      },
      {
        internalType: 'bytes32[]',
        name: 'protocolIds',
        type: 'bytes32[]',
      },
    ],
    name: 'isUserRegistered',
    outputs: [
      {
        internalType: 'bool[]',
        name: '',
        type: 'bool[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingDefaultAdmin',
    outputs: [
      {
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
      {
        internalType: 'uint48',
        name: 'schedule',
        type: 'uint48',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingDefaultAdminDelay',
    outputs: [
      {
        internalType: 'uint48',
        name: 'newDelay',
        type: 'uint48',
      },
      {
        internalType: 'uint48',
        name: 'schedule',
        type: 'uint48',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32[]',
        name: 'protocolIds',
        type: 'bytes32[]',
      },
    ],
    name: 'registerReferrals',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'referrerId',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32[]',
        name: 'protocolIds',
        type: 'bytes32[]',
      },
      {
        internalType: 'uint256[]',
        name: 'rewardRates',
        type: 'uint256[]',
      },
      {
        internalType: 'address',
        name: 'rewardAddress',
        type: 'address',
      },
    ],
    name: 'registerReferrer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'rollbackDefaultAdminDelay',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
