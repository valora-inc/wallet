export const registryContractAbi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'protocolId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
      },
    ],
    name: 'ReferrerNotRegistered',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'protocolId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
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
    inputs: [
      {
        indexed: true,
        internalType: 'string',
        name: 'protocolId',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
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
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
      },
      {
        indexed: true,
        internalType: 'string[]',
        name: 'protocolIds',
        type: 'string[]',
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
    inputs: [
      {
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
      },
    ],
    name: 'getProtocols',
    outputs: [
      {
        internalType: 'string[]',
        name: '',
        type: 'string[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'protocolId',
        type: 'string',
      },
    ],
    name: 'getReferrers',
    outputs: [
      {
        internalType: 'string[]',
        name: '',
        type: 'string[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
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
        internalType: 'string',
        name: 'protocolId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
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
        internalType: 'string',
        name: 'protocolId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
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
        internalType: 'string',
        name: 'referrerId',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'protocolId',
        type: 'string',
      },
    ],
    name: 'registerReferral',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_referrerId',
        type: 'string',
      },
      {
        internalType: 'string[]',
        name: '_protocolIds',
        type: 'string[]',
      },
      {
        internalType: 'uint256[]',
        name: '_rewardRates',
        type: 'uint256[]',
      },
      {
        internalType: 'address',
        name: '_rewardAddress',
        type: 'address',
      },
    ],
    name: 'registerReferrer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
