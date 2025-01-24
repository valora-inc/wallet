import {
  getPreparedTransactions,
  getSerializablePreparedTransactions,
} from 'src/viem/preparedTransactionSerialization'

describe(getSerializablePreparedTransactions, () => {
  it('should turn bigints into strings for known bigint keys', () => {
    expect(
      getSerializablePreparedTransactions([
        {
          from: '0x123',
          to: '0x456',
          value: BigInt(123),
          gas: BigInt(456),
          maxFeePerGas: BigInt(789),
          maxPriorityFeePerGas: BigInt(1011),
          // @ts-expect-error: unknown key, will be ignored, but TS will prevent in normal use
          unknown: BigInt(1415),
        },
      ])
    ).toStrictEqual([
      {
        from: '0x123',
        to: '0x456',
        value: '123',
        gas: '456',
        maxFeePerGas: '789',
        maxPriorityFeePerGas: '1011',
        unknown: BigInt(1415), // not touched
      },
    ])
  })

  it('should not touch undefined values', () => {
    expect(
      getSerializablePreparedTransactions([
        {
          from: '0x123',
          to: '0x456',
          value: undefined,
          gas: BigInt(456),
        },
      ])
    ).toStrictEqual([
      {
        from: '0x123',
        to: '0x456',
        value: undefined,
        gas: '456',
      },
    ])
  })
})

describe(getPreparedTransactions, () => {
  it('should turn strings into bigints for known bigint keys', () => {
    expect(
      getPreparedTransactions([
        {
          from: '0x123',
          to: '0x456',
          value: '123',
          gas: '456',
          maxFeePerGas: '789',
          maxPriorityFeePerGas: '1011',
          // @ts-expect-error: unknown key, will be ignored, but TS will prevent in normal use
          unknown: BigInt(1415), // not touched
        },
      ])
    ).toStrictEqual([
      {
        from: '0x123',
        to: '0x456',
        value: BigInt(123),
        gas: BigInt(456),
        maxFeePerGas: BigInt(789),
        maxPriorityFeePerGas: BigInt(1011),
        unknown: BigInt(1415), // not touched
      },
    ])
  })

  it('should not touch undefined values', () => {
    expect(
      getPreparedTransactions([
        {
          from: '0x123',
          to: '0x456',
          value: undefined,
          gas: '456',
        },
      ])
    ).toStrictEqual([
      {
        from: '0x123',
        to: '0x456',
        value: undefined,
        gas: BigInt(456),
      },
    ])
  })
})
