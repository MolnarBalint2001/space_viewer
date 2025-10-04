# AdminCoverageApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**adminCoverageDatasetsGet**](#admincoveragedatasetsget) | **GET** /admin/coverage/datasets | Lefedettségi datasetek listázása|
|[**adminCoverageDatasetsIdGeojsonGet**](#admincoveragedatasetsidgeojsonget) | **GET** /admin/coverage/datasets/{id}/geojson | Lefedettségi dataset GeoJSON export (admin)|
|[**adminCoverageDatasetsPost**](#admincoveragedatasetspost) | **POST** /admin/coverage/datasets | Lefedettségi shapefile feltöltése (admin)|
|[**adminCoverageUnavailableSpotsGet**](#admincoverageunavailablespotsget) | **GET** /admin/coverage/unavailable-spots | Lefedettséggel nem rendelkező lekérdezési pontok (admin)|

# **adminCoverageDatasetsGet**
> AdminCoverageDatasetsGet200Response adminCoverageDatasetsGet()


### Example

```typescript
import {
    AdminCoverageApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminCoverageApi(configuration);

const { status, data } = await apiInstance.adminCoverageDatasetsGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**AdminCoverageDatasetsGet200Response**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Dataset lista |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminCoverageDatasetsIdGeojsonGet**
> GeoJsonFeatureCollection adminCoverageDatasetsIdGeojsonGet()


### Example

```typescript
import {
    AdminCoverageApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminCoverageApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.adminCoverageDatasetsIdGeojsonGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**GeoJsonFeatureCollection**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | FeatureCollection |  -  |
|**404** | Nem található dataset |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminCoverageDatasetsPost**
> CoverageIngestResponse adminCoverageDatasetsPost()

Adminisztrátorok által feltöltött SHP állomány (zip) feldolgozása és lefedettségi polygonok tárolása PostGIS-ben. A shapefile-ban HRSZ mezőnek kell szerepelnie. 

### Example

```typescript
import {
    AdminCoverageApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminCoverageApi(configuration);

let archive: File; //Zippelt shapefile (.zip) a .shp/.dbf/.shx/.prj állományokkal (default to undefined)
let name: string; //Dataset megjelenített neve (default to undefined)
let description: string; //Opcionális leírás (optional) (default to undefined)
let srid: number; //Eredeti vetület EPSG kódja (opcionális, alapértelmezés szerint 4326)  (optional) (default to undefined)

const { status, data } = await apiInstance.adminCoverageDatasetsPost(
    archive,
    name,
    description,
    srid
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **archive** | [**File**] | Zippelt shapefile (.zip) a .shp/.dbf/.shx/.prj állományokkal | defaults to undefined|
| **name** | [**string**] | Dataset megjelenített neve | defaults to undefined|
| **description** | [**string**] | Opcionális leírás | (optional) defaults to undefined|
| **srid** | [**number**] | Eredeti vetület EPSG kódja (opcionális, alapértelmezés szerint 4326)  | (optional) defaults to undefined|


### Return type

**CoverageIngestResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Sikeres feldolgozás |  -  |
|**400** | Hibás kérés vagy érvénytelen shapefile |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminCoverageUnavailableSpotsGet**
> AdminCoverageUnavailableSpotsGet200Response adminCoverageUnavailableSpotsGet()


### Example

```typescript
import {
    AdminCoverageApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new AdminCoverageApi(configuration);

let sinceDays: number; //Csak az utóbbi N napban észlelt hiányzó pontok (optional) (default to undefined)

const { status, data } = await apiInstance.adminCoverageUnavailableSpotsGet(
    sinceDays
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **sinceDays** | [**number**] | Csak az utóbbi N napban észlelt hiányzó pontok | (optional) defaults to undefined|


### Return type

**AdminCoverageUnavailableSpotsGet200Response**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aggregált pontok |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

