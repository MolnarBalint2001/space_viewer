# AdminFeedbackItem


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [default to undefined]
**rating** | **number** |  | [default to undefined]
**comment** | **string** |  | [default to undefined]
**createdAt** | **string** |  | [default to undefined]
**isApproved** | **boolean** |  | [default to undefined]
**approvedAt** | **string** |  | [optional] [default to undefined]
**user** | [**AdminFeedbackUser**](AdminFeedbackUser.md) |  | [optional] [default to undefined]
**approvedBy** | [**AdminFeedbackApprover**](AdminFeedbackApprover.md) |  | [optional] [default to undefined]

## Example

```typescript
import { AdminFeedbackItem } from './api';

const instance: AdminFeedbackItem = {
    id,
    rating,
    comment,
    createdAt,
    isApproved,
    approvedAt,
    user,
    approvedBy,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
