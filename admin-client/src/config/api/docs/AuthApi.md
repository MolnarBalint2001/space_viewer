# AuthApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**authLoginPost**](#authloginpost) | **POST** /auth/login | Bejelentkezés (JWT)|
|[**authRegisterPost**](#authregisterpost) | **POST** /auth/register | Regisztráció (e-mail megerősítéssel)|
|[**authVerifyEmailGet**](#authverifyemailget) | **GET** /auth/verify-email | E-mail megerősítés (query token)|
|[**authVerifyEmailPost**](#authverifyemailpost) | **POST** /auth/verify-email | E-mail megerősítés (body token)|

# **authLoginPost**
> AuthLoginPost200Response authLoginPost(loginDto)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    LoginDto
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let loginDto: LoginDto; //

const { status, data } = await apiInstance.authLoginPost(
    loginDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **loginDto** | **LoginDto**|  | |


### Return type

**AuthLoginPost200Response**

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
|**403** | E-mail nincs megerősítve |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authRegisterPost**
> AuthRegisterPost201Response authRegisterPost(registerDto)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    RegisterDto
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let registerDto: RegisterDto; //

const { status, data } = await apiInstance.authRegisterPost(
    registerDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **registerDto** | **RegisterDto**|  | |


### Return type

**AuthRegisterPost201Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Sikeres regisztráció |  -  |
|**409** | E-mail már foglalt |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authVerifyEmailGet**
> AuthVerifyEmailGet200Response authVerifyEmailGet()


### Example

```typescript
import {
    AuthApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let token: string; // (default to undefined)

const { status, data } = await apiInstance.authVerifyEmailGet(
    token
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **token** | [**string**] |  | defaults to undefined|


### Return type

**AuthVerifyEmailGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Megerősítve |  -  |
|**400** | Hibás/hiányzó token |  -  |
|**404** | Felhasználó nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **authVerifyEmailPost**
> AuthVerifyEmailGet200Response authVerifyEmailPost(verifyEmailDto)


### Example

```typescript
import {
    AuthApi,
    Configuration,
    VerifyEmailDto
} from './api';

const configuration = new Configuration();
const apiInstance = new AuthApi(configuration);

let verifyEmailDto: VerifyEmailDto; //

const { status, data } = await apiInstance.authVerifyEmailPost(
    verifyEmailDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **verifyEmailDto** | **VerifyEmailDto**|  | |


### Return type

**AuthVerifyEmailGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Megerősítve |  -  |
|**400** | Hibás/lejárt token |  -  |
|**404** | Felhasználó nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

