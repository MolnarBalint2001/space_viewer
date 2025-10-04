# OrderListItem


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [default to undefined]
**status** | [**OrderStatus**](OrderStatus.md) |  | [default to undefined]
**billingFirstName** | **string** |  | [optional] [default to undefined]
**billingLastName** | **string** |  | [optional] [default to undefined]
**billingEmail** | **string** |  | [optional] [default to undefined]
**billingPhoneNumber** | **string** |  | [optional] [default to undefined]
**billingCountry** | **string** |  | [optional] [default to undefined]
**billingCity** | **string** |  | [optional] [default to undefined]
**billingPostalCode** | **string** |  | [optional] [default to undefined]
**billingStreet1** | **string** |  | [optional] [default to undefined]
**billingStreet2** | **string** |  | [optional] [default to undefined]
**_package** | [**PackageSummaryDto**](PackageSummaryDto.md) |  | [optional] [default to undefined]
**user** | [**UserSummary**](UserSummary.md) |  | [optional] [default to undefined]
**assets** | [**Array&lt;OrderAsset&gt;**](OrderAsset.md) |  | [optional] [default to undefined]
**createdAt** | **string** |  | [default to undefined]
**updatedAt** | **string** |  | [default to undefined]

## Example

```typescript
import { OrderListItem } from './api';

const instance: OrderListItem = {
    id,
    status,
    billingFirstName,
    billingLastName,
    billingEmail,
    billingPhoneNumber,
    billingCountry,
    billingCity,
    billingPostalCode,
    billingStreet1,
    billingStreet2,
    _package,
    user,
    assets,
    createdAt,
    updatedAt,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
