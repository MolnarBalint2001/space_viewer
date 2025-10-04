# FeedbackApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**feedbackLatestGet**](#feedbacklatestget) | **GET** /feedback/latest | Legutóbbi 10 visszajelzés|
|[**feedbackPost**](#feedbackpost) | **POST** /feedback | Visszajelzés beküldése|

# **feedbackLatestGet**
> PublicFeedbackListResponse feedbackLatestGet()

Publikus végpont, amely a legfrissebb 10 darab visszajelzést adja vissza.

### Example

```typescript
import {
    FeedbackApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new FeedbackApi(configuration);

const { status, data } = await apiInstance.feedbackLatestGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**PublicFeedbackListResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Lista a legutóbbi visszajelzésekről |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **feedbackPost**
> FeedbackCreatedResponse feedbackPost(createFeedbackDto)

Authentikált felhasználó visszajelzést küldhet a szolgáltatásról csillagos értékeléssel és szöveges kommenttel.

### Example

```typescript
import {
    FeedbackApi,
    Configuration,
    CreateFeedbackDto
} from './api';

const configuration = new Configuration();
const apiInstance = new FeedbackApi(configuration);

let createFeedbackDto: CreateFeedbackDto; //

const { status, data } = await apiInstance.feedbackPost(
    createFeedbackDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createFeedbackDto** | **CreateFeedbackDto**|  | |


### Return type

**FeedbackCreatedResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Visszajelzés rögzítve |  -  |
|**400** | Érvénytelen bemenet |  -  |
|**401** | Hitelesítés szükséges |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

