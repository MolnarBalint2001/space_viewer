# OrdersApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**ordersGet**](#ordersget) | **GET** /orders | Get all orders (paginated)|
|[**ordersIdAssetsGet**](#ordersidassetsget) | **GET** /orders/{id}/assets | Saját rendeléshez tartozó assetek lekérdezése|
|[**ordersIdAssetsPost**](#ordersidassetspost) | **POST** /orders/{id}/assets | Rendeléshez tartozó állományok feltöltése (admin)|
|[**ordersIdStatusPatch**](#ordersidstatuspatch) | **PATCH** /orders/{id}/status | Rendelés státusz frissítése (admin)|
|[**ordersMeGet**](#ordersmeget) | **GET** /orders/me | Saját rendelések (bejelentkezett felhasználó)|
|[**ordersPost**](#orderspost) | **POST** /orders | Létrehoz egy rendelést a bejelentkezett felhasználónak|
|[**ordersSessionPost**](#orderssessionpost) | **POST** /orders/session | Create an order session for the user|
|[**ordersSessionSessionIdGet**](#orderssessionsessionidget) | **GET** /orders/session/{sessionId} | Get order session data|

# **ordersGet**
> OrderGetAllResponseBody ordersGet()


### Example

```typescript
import {
    OrdersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let page: number; // (optional) (default to 1)
let pageSize: number; // (optional) (default to 20)

const { status, data } = await apiInstance.ordersGet(
    page,
    pageSize
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] |  | (optional) defaults to 1|
| **pageSize** | [**number**] |  | (optional) defaults to 20|


### Return type

**OrderGetAllResponseBody**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Paginált rendeléslista |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ordersIdAssetsGet**
> OrderAssetsResponseBody ordersIdAssetsGet()


### Example

```typescript
import {
    OrdersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.ordersIdAssetsGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**OrderAssetsResponseBody**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A rendeléshez tartozó assetek listája |  -  |
|**401** | Jogosulatlan |  -  |
|**403** | Hozzáférés megtagadva |  -  |
|**404** | Nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ordersIdAssetsPost**
> OrderAssetsResponseBody ordersIdAssetsPost()

Feltölti és elmenti a kiválasztott rendeléshez tartozó LOD2, él-, tetőelem- és LiDAR fájlokat.

### Example

```typescript
import {
    OrdersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let id: string; // (default to undefined)
let lod2: File; //LOD2 GeoJSON állomány (default to undefined)
let edges: File; //Él geometria GeoJSON formátumban (default to undefined)
let roofObjects: File; //Tetőelemek GeoJSON állomány (default to undefined)
let lidar: File; //LiDAR LAZ állomány (default to undefined)

const { status, data } = await apiInstance.ordersIdAssetsPost(
    id,
    lod2,
    edges,
    roofObjects,
    lidar
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|
| **lod2** | [**File**] | LOD2 GeoJSON állomány | defaults to undefined|
| **edges** | [**File**] | Él geometria GeoJSON formátumban | defaults to undefined|
| **roofObjects** | [**File**] | Tetőelemek GeoJSON állomány | defaults to undefined|
| **lidar** | [**File**] | LiDAR LAZ állomány | defaults to undefined|


### Return type

**OrderAssetsResponseBody**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Rendeléshez tartozó állományok metaadatainak listája |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ordersIdStatusPatch**
> ordersIdStatusPatch(ordersIdStatusPatchRequest)


### Example

```typescript
import {
    OrdersApi,
    Configuration,
    OrdersIdStatusPatchRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let id: string; // (default to undefined)
let ordersIdStatusPatchRequest: OrdersIdStatusPatchRequest; //

const { status, data } = await apiInstance.ordersIdStatusPatch(
    id,
    ordersIdStatusPatchRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **ordersIdStatusPatchRequest** | **OrdersIdStatusPatchRequest**|  | |
| **id** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Frissített rendelés |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ordersMeGet**
> Array<OrderListItem> ordersMeGet()

Visszaadja a bejelentkezett felhasználó összes rendelését (legújabb elöl).

### Example

```typescript
import {
    OrdersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

const { status, data } = await apiInstance.ordersMeGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<OrderListItem>**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Bejelentkezett felhasználó rendelései (legújabb elöl) |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ordersPost**
> OrderListItem ordersPost(createOrderDto)

A megadott csomagra és számlázási adatokkal létrehoz egy új rendelést.

### Example

```typescript
import {
    OrdersApi,
    Configuration,
    CreateOrderDto
} from './api';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let createOrderDto: CreateOrderDto; //

const { status, data } = await apiInstance.ordersPost(
    createOrderDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createOrderDto** | **CreateOrderDto**|  | |


### Return type

**OrderListItem**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Sikeres rendelés létrehozása |  -  |
|**404** | Csomag nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ordersSessionPost**
> CreateOrderSessionResponseBody ordersSessionPost(createOrderSessionDto)


### Example

```typescript
import {
    OrdersApi,
    Configuration,
    CreateOrderSessionDto
} from './api';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let createOrderSessionDto: CreateOrderSessionDto; //

const { status, data } = await apiInstance.ordersSessionPost(
    createOrderSessionDto
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **createOrderSessionDto** | **CreateOrderSessionDto**|  | |


### Return type

**CreateOrderSessionResponseBody**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **ordersSessionSessionIdGet**
> OrderSessionDataResponseBody ordersSessionSessionIdGet()


### Example

```typescript
import {
    OrdersApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new OrdersApi(configuration);

let sessionId: string; // (default to undefined)

const { status, data } = await apiInstance.ordersSessionSessionIdGet(
    sessionId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **sessionId** | [**string**] |  | defaults to undefined|


### Return type

**OrderSessionDataResponseBody**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Rendelési munkamenet összefoglaló adatai |  -  |
|**404** | Nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

