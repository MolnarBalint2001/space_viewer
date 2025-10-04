# StepGuideApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**stepGuideGet**](#stepguideget) | **GET** /step-guide | Rendelési segédlépések lekérdezése|

# **stepGuideGet**
> StepGuideListResponse stepGuideGet()

Publikus lista a rendelés folyamatát segítő lépésekről.

### Example

```typescript
import {
    StepGuideApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new StepGuideApi(configuration);

const { status, data } = await apiInstance.stepGuideGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**StepGuideListResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Lépések listája |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

