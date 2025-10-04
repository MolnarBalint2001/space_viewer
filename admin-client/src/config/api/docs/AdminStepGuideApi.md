# AdminStepGuideApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**adminStepGuideGet**](#adminstepguideget) | **GET** /admin/step-guide | Step guide lépések listázása (admin)|
|[**adminStepGuideIdDelete**](#adminstepguideiddelete) | **DELETE** /admin/step-guide/{id} | Step guide lépés törlése|
|[**adminStepGuideIdPut**](#adminstepguideidput) | **PUT** /admin/step-guide/{id} | Step guide lépés frissítése|
|[**adminStepGuidePost**](#adminstepguidepost) | **POST** /admin/step-guide | Új step guide lépés létrehozása|

# **adminStepGuideGet**
> StepGuideListResponse adminStepGuideGet()


### Example

```typescript
import {
    AdminStepGuideApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminStepGuideApi(configuration);

const { status, data } = await apiInstance.adminStepGuideGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**StepGuideListResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Lépések listája |  -  |
|**401** | Jogosulatlan |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminStepGuideIdDelete**
> adminStepGuideIdDelete()


### Example

```typescript
import {
    AdminStepGuideApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminStepGuideApi(configuration);

let id: string; //A törlendő lépés azonosítója. (default to undefined)

const { status, data } = await apiInstance.adminStepGuideIdDelete(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | A törlendő lépés azonosítója. | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Törlés sikeres |  -  |
|**401** | Jogosulatlan |  -  |
|**404** | Nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminStepGuideIdPut**
> AdminStepGuidePost201Response adminStepGuideIdPut(stepGuideUpdateRequest)


### Example

```typescript
import {
    AdminStepGuideApi,
    Configuration,
    StepGuideUpdateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminStepGuideApi(configuration);

let id: string; //A módosítandó lépés azonosítója. (default to undefined)
let stepGuideUpdateRequest: StepGuideUpdateRequest; //

const { status, data } = await apiInstance.adminStepGuideIdPut(
    id,
    stepGuideUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **stepGuideUpdateRequest** | **StepGuideUpdateRequest**|  | |
| **id** | [**string**] | A módosítandó lépés azonosítója. | defaults to undefined|


### Return type

**AdminStepGuidePost201Response**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Frissített lépés |  -  |
|**400** | Hibás kérelem |  -  |
|**401** | Jogosulatlan |  -  |
|**404** | Nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminStepGuidePost**
> AdminStepGuidePost201Response adminStepGuidePost(stepGuideCreateRequest)


### Example

```typescript
import {
    AdminStepGuideApi,
    Configuration,
    StepGuideCreateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminStepGuideApi(configuration);

let stepGuideCreateRequest: StepGuideCreateRequest; //

const { status, data } = await apiInstance.adminStepGuidePost(
    stepGuideCreateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **stepGuideCreateRequest** | **StepGuideCreateRequest**|  | |


### Return type

**AdminStepGuidePost201Response**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Létrehozott lépés |  -  |
|**400** | Hibás kérelem |  -  |
|**401** | Jogosulatlan |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

