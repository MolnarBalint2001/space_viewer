# OrderAsset


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [default to undefined]
**orderId** | **string** |  | [default to undefined]
**type** | [**OrderAssetType**](OrderAssetType.md) |  | [default to undefined]
**objectKey** | **string** | MinIO objektum kulcsa | [default to undefined]
**createdAt** | **string** |  | [default to undefined]
**updatedAt** | **string** |  | [default to undefined]
**url** | **string** | Előre aláírt letöltési URL az assethez | [optional] [default to undefined]

## Example

```typescript
import { OrderAsset } from './api';

const instance: OrderAsset = {
    id,
    orderId,
    type,
    objectKey,
    createdAt,
    updatedAt,
    url,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
