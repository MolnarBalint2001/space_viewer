# AdminAuthApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**adminAuthLoginPost**](#adminauthloginpost) | **POST** /admin/auth/login | Bejelentkezés - Admin (JWT)|

# **adminAuthLoginPost**
> AdminAuthLoginPost200Response adminAuthLoginPost(loginDto)


### Example

```typescript
import {
    AdminAuthApi,
    Configuration,
    LoginDto
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminAuthApi(configuration);

let loginDto: LoginDto; //

const { status, data } = await apiInstance.adminAuthLoginPost(
    loginDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loginDto** | **LoginDto**|  | |


### Return type

**AdminAuthLoginPost200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Sikeres bejelentkezés |  -  |
|**401** | Hibás hitelesítő adatok |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

