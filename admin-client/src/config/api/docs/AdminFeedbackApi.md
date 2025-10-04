# AdminFeedbackApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**adminFeedbackGet**](#adminfeedbackget) | **GET** /admin/feedback | Visszajelzések listázása (admin)|
|[**adminFeedbackIdApprovePost**](#adminfeedbackidapprovepost) | **POST** /admin/feedback/{id}/approve | Visszajelzés jóváhagyása|

# **adminFeedbackGet**
> AdminFeedbackListResponse adminFeedbackGet()

Admin jogosultságot igényel, paginált listát ad vissza a beérkezett visszajelzésekről.

### Example

```typescript
import {
    AdminFeedbackApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminFeedbackApi(configuration);

let page: number; //Oldalszám (1-alapú). (optional) (default to 1)
let pageSize: number; //Találatok száma oldalanként. (optional) (default to 20)

const { status, data } = await apiInstance.adminFeedbackGet(
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] | Oldalszám (1-alapú). | (optional) defaults to 1|
| **pageSize** | [**number**] | Találatok száma oldalanként. | (optional) defaults to 20|


### Return type

**AdminFeedbackListResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Paginált visszajelzés lista |  -  |
|**401** | Jogosulatlan |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminFeedbackIdApprovePost**
> AdminFeedbackIdApprovePost200Response adminFeedbackIdApprovePost()

Admin jogosultság mellett véglegesíti a beérkezett visszajelzést, ami ezt követően publikus lesz.

### Example

```typescript
import {
    AdminFeedbackApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminFeedbackApi(configuration);

let id: string; //A visszajelzés azonosítója. (default to undefined)

const { status, data } = await apiInstance.adminFeedbackIdApprovePost(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] | A visszajelzés azonosítója. | defaults to undefined|


### Return type

**AdminFeedbackIdApprovePost200Response**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Jóváhagyott visszajelzés |  -  |
|**401** | Jogosulatlan |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

