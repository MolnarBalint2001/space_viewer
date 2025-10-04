# PackagesApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getAvailablePackages**](#getavailablepackages) | **GET** /packages/available | Elérhető csomagok egy földrajzi pozícióhoz|
|[**packagesGet**](#packagesget) | **GET** /packages | Összes csomag listázása (admin)|
|[**packagesIdPut**](#packagesidput) | **PUT** /packages/{id} | Csomag frissítése (admin)|

# **getAvailablePackages**
> AvailablePackagesEnvelope getAvailablePackages()

Lekérdezi az adott WGS84 koordinátára (lon/lat) elérhető csomagokat és – ha a rendszerben tárolt lefedettségi polygon érinti a pontot – visszaadja a megfelelő HRSZ-geometriát és metaadatokat is. 

### Example

```typescript
import {
    PackagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PackagesApi(configuration);

let lon: number; //Hosszúság (WGS84, fok). (default to undefined)
let lat: number; //Szélesség (WGS84, fok). (default to undefined)

const { status, data } = await apiInstance.getAvailablePackages(
    lon,
    lat
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **lon** | [**number**] | Hosszúság (WGS84, fok). | defaults to undefined|
| **lat** | [**number**] | Szélesség (WGS84, fok). | defaults to undefined|


### Return type

**AvailablePackagesEnvelope**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Sikeres lekérdezés. |  -  |
|**400** | Hibás kérés (pl. hiányzó vagy rossz koordináta) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **packagesGet**
> Array<Package> packagesGet()


### Example

```typescript
import {
    PackagesApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PackagesApi(configuration);

const { status, data } = await apiInstance.packagesGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<Package>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Sikeres lekérdezés |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **packagesIdPut**
> Package packagesIdPut(updatePackageDto)


### Example

```typescript
import {
    PackagesApi,
    Configuration,
    UpdatePackageDto
} from './api';

const configuration = new Configuration();
const apiInstance = new PackagesApi(configuration);

let id: string; // (default to undefined)
let updatePackageDto: UpdatePackageDto; //

const { status, data } = await apiInstance.packagesIdPut(
    id,
    updatePackageDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **updatePackageDto** | **UpdatePackageDto**|  | |
| **id** | [**string**] |  | defaults to undefined|


### Return type

**Package**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Frissített csomag |  -  |
|**404** | Nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

