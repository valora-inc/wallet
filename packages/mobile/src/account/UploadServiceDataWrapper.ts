import { ensureLeading0x, Err, Ok, Result } from '@celo/base'
import { Address, ContractKit } from '@celo/contractkit'
import {
  FetchError,
  InvalidSignature,
  OffchainDataWrapper,
  OffchainErrors,
} from '@celo/identity/lib/offchain-data-wrapper'
import { buildEIP712TypedData, resolvePath, signBuffer } from '@celo/identity/lib/offchain/utils'
import { publicKeyToAddress, toChecksumAddress } from '@celo/utils/lib/address'
import { verifyEIP712TypedDataSigner } from '@celo/utils/lib/signatureUtils'
import { SignedPostPolicyV4Output } from '@google-cloud/storage'
// Use targetted import otherwise the RN FormData gets used which doesn't support Buffer related functionality
import FormData from 'form-data/lib/form_data'
import * as t from 'io-ts'
import config from 'src/geth/networkConfig'
import Logger from 'src/utils/Logger'

const TAG = 'UploadServiceDataWrapper'

const expirationTime = 5 * 1000 * 60 // 5 minutes

// Hacky way to get Buffer from Blob
// Note: this is gonna transfer the whole data over the RN bridge (as base64 encoded string)
// and should be avoided for large files!
function blobToBuffer(blob: Blob) {
  const reader = new FileReader()
  reader.readAsDataURL(blob)
  return new Promise<Buffer>((resolve, reject) => {
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unexpected result type'))
      } else {
        // Result looks like "data:application/octet-stream;base64,BLMHTkM..."
        // Extract the base64 part
        const base64 = result.substr(result.lastIndexOf(',') + 1)
        resolve(Buffer.from(base64, 'base64'))
      }
    }
  })
}

// This data wrapper is passed to the offchain accessors (ex. PrivateNameAccessor and PrivatePictureAccessor)
// It provides the functionality for reading/writing data to the backend via Valora
export default class UploadServiceDataWrapper implements OffchainDataWrapper {
  signer: Address
  self: Address

  constructor(readonly kit: ContractKit, address: Address, dataEncryptionKey: Address) {
    this.signer = dataEncryptionKey
    this.self = address
  }

  sendFormData(url: string, formData: typeof FormData): Promise<string> {
    return fetch(url, {
      method: 'POST',
      headers: formData.getHeaders(),
      // Use getBuffer() which ends up transferring the body as base64 data over the RN bridge
      // because RN doesn't support Buffer inside FormData
      // See https://github.com/facebook/react-native/blob/b26a9549ce2dffd1d0073ae13502830459051c27/Libraries/Network/convertRequestBody.js#L34
      // and https://github.com/facebook/react-native/blob/b26a9549ce2dffd1d0073ae13502830459051c27/Libraries/Network/FormData.js
      body: formData.getBuffer(),
    }).then((x) => {
      if (!x.ok) {
        Logger.error(TAG + '@sendFormData', 'Error uploading ' + x.headers.get('location'))
      }
      return x.text()
    })
  }

  async authorizeURLs(data: any, signature: string): Promise<SignedPostPolicyV4Output[]> {
    const response = await fetch(config.CIP8AuthorizerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Signature: signature,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      Logger.warn(
        TAG + '@authorizeURLs',
        'Error authorizing urls ' + response.headers.get('location')
      )
      throw new Error(
        `Error authorizing CIP8 urls, with status ${
          response.status
        }, text: ${await response.text()}`
      )
    }

    return response.json()
  }

  async writeDataTo(
    data: Buffer,
    signature: Buffer,
    dataPath: string
  ): Promise<OffchainErrors | void> {
    const dataPayloads = [data, signature]
    const signedUrlsPayload = {
      address: this.self,
      signer: this.signer,
      expiration: Date.now() + expirationTime,
      data: [
        {
          path: dataPath,
        },
        {
          path: `${dataPath}.signature`,
        },
      ],
    }

    const bufferPayload = Buffer.from(JSON.stringify(signedUrlsPayload))
    const authorization = await signBuffer(this, dataPath, bufferPayload)
    try {
      const signedUrls = await this.authorizeURLs(signedUrlsPayload, authorization)
      await Promise.all(
        signedUrls.map(({ url, fields }, i) => {
          const formData = new FormData()
          for (const name of Object.keys(fields)) {
            formData.append(name, fields[name])
          }
          formData.append('file', dataPayloads[i])

          return this.sendFormData(url, formData)
        })
      )
    } catch (error) {
      Logger.error(TAG + '@writeDataTo', 'Error', error)
      return new FetchError(error)
    }
  }

  // Workaround fetch response.arrayBuffer() not working in RN environment
  // See https://github.com/facebook/react-native/blob/f96478778cc00da8c11da17f9591dbdf928e7437/Libraries/Blob/FileReader.js#L85
  async responseBuffer(response: Response) {
    const blob = await response.blob()
    return blobToBuffer(blob)
  }

  // fetches encrypted data and its signature, verifies that signature matches the payload
  async readDataFromAsResult<DataType>(
    account: Address,
    dataPath: string,
    _checkOffchainSigners: boolean,
    type?: t.Type<DataType>
  ): Promise<Result<Buffer, OffchainErrors>> {
    let dataResponse, signatureResponse
    const accountRoot = `${config.CIP8MetadataUrl}/${toChecksumAddress(account)}`
    const headers = {
      headers: {
        cache: 'no-store',
      },
    }
    try {
      ;[dataResponse, signatureResponse] = await Promise.all([
        fetch(resolvePath(accountRoot, dataPath), headers),
        fetch(resolvePath(accountRoot, `${dataPath}.signature`), headers),
      ])
    } catch (error) {
      return Err(new FetchError(error))
    }

    if (!dataResponse.ok) {
      return Err(new FetchError(new Error(dataResponse.statusText)))
    }
    if (!signatureResponse.ok) {
      return Err(new FetchError(new Error(signatureResponse.statusText)))
    }

    const [dataBody, signatureBody] = await Promise.all([
      this.responseBuffer(dataResponse),
      this.responseBuffer(signatureResponse),
    ])

    const body = Buffer.from(dataBody)
    const signature = ensureLeading0x(Buffer.from(signatureBody).toString('hex'))

    const toParse = type ? JSON.parse(body.toString()) : body
    const typedData = await buildEIP712TypedData(this, dataPath, toParse, type)

    const accounts = await this.kit.contracts.getAccounts()
    const claimedSigner = publicKeyToAddress(await accounts.getDataEncryptionKey(account))
    if (verifyEIP712TypedDataSigner(typedData, signature, claimedSigner)) {
      return Ok(body)
    }
    return Err(new InvalidSignature())
  }
}
