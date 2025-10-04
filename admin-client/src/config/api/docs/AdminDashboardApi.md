# AdminDashboardApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**adminDashboardMetricsGet**](#admindashboardmetricsget) | **GET** /admin/dashboard/metrics | Dashboard metrikák lekérdezése|

# **adminDashboardMetricsGet**
> AdminDashboardMetrics adminDashboardMetricsGet()

Aggregált rendelés, bevétel, látogató és visszajelzés statisztikák az admin kezdőlaphoz.

### Example

```typescript
import {
    AdminDashboardApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminDashboardApi(configuration);

const { status, data } = await apiInstance.adminDashboardMetricsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**AdminDashboardMetrics**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Dashboard metrikák |  -  |
|**401** | Jogosulatlan |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

