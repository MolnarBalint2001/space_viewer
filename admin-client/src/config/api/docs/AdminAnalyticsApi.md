# AdminAnalyticsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**adminAnalyticsSummaryGet**](#adminanalyticssummaryget) | **GET** /admin/analytics/summary | Admin analitika összefoglaló|

# **adminAnalyticsSummaryGet**
> AnalyticsSummary adminAnalyticsSummaryGet()

Kulcs metrikák havi bontásban (bevétel, rendelések, felhasználók).

### Example

```typescript
import {
    AdminAnalyticsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminAnalyticsApi(configuration);

const { status, data } = await apiInstance.adminAnalyticsSummaryGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**AnalyticsSummary**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Analitika összefoglaló |  -  |
|**401** | Jogosulatlan |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

