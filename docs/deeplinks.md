# Deeplinks

## Payment

You can create a deeplink that will prompt the user to make a payment to an address.

The deeplink will look like this `celo://wallet/pay?{...queryParams}`
where the query parameters can be:

- `address` (required): The address that will be the recipient of the payment.
- `displayName` (optional): The URL-encoded name of the recipient. If you leave this empty the address will be shown instead.
- `comment` (optional): A URL-encoded text that explains the reason for the payment.
- `token` (optional): The token you want the payment to be in. Can be `cUSD`, `cEUR` or `CELO`. If you pass a different value or nothing the app will use cUSD.
- `amount` (optional): The amount to send. If you don't pass a value the user will have to input the amount if `token` is `cUSD` or not work at all if `token` is `CELO`.
- `currencyCode` (optional, recommended if amount is set): The fiat currency in which the user will see the payment amount. Users of the app can choose which currency they see values in the app by default so if you set the amount it's strongly recommended to set a value for this so you make sure you receive the expected amount. Possible values are the ones listed [in the `LocalCurrencyCode` enum here](https://github.com/celo-org/wallet/blob/main/src/localCurrency/consts.ts#L2)

To URL encode a text you can use the [encodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI) function or a web tool like https://www.urlencoder.org/

Example payment deeplink:

`celo://wallet/pay?address=0x4b371df8d05abd2954564b54faf10b8c8f1bc3a2&displayName=Example%20name&amount=9.50&comment=Burger%20with%20fries&token=cUSD&currencyCode=USD`

Smallest possible payment deeplink:

`celo://wallet/pay?address=0x4b371df8d05abd2954564b54faf10b8c8f1bc3a2`
