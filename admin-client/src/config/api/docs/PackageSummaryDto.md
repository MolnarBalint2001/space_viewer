# PackageSummaryDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [default to undefined]
**name** | **string** |  | [default to undefined]
**description** | **string** |  | [default to undefined]
**tags** | **string** | Vesszővel elválasztott címkék (pl.: \&quot;akcios,uj\&quot;) | [optional] [default to undefined]
**price** | **number** | Bruttó ár HUF-ban. | [default to undefined]

## Example

```typescript
import { PackageSummaryDto } from './api';

const instance: PackageSummaryDto = {
    id,
    name,
    description,
    tags,
    price,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
