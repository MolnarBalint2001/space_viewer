# DatasetsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**adminDatasetsDatasetIdAttachmentsAttachmentIdDownloadGet**](#admindatasetsdatasetidattachmentsattachmentiddownloadget) | **GET** /admin/datasets/{datasetId}/attachments/{attachmentId}/download | Melléklet letöltési linkje|
|[**adminDatasetsDatasetIdAttachmentsPost**](#admindatasetsdatasetidattachmentspost) | **POST** /admin/datasets/{datasetId}/attachments | PDF mellékletek feltöltése|
|[**adminDatasetsDatasetIdFilesFileIdDownloadGet**](#admindatasetsdatasetidfilesfileiddownloadget) | **GET** /admin/datasets/{datasetId}/files/{fileId}/download | TIF fájl letöltési linkje|
|[**adminDatasetsDatasetIdFilesFileIdMbtilesGet**](#admindatasetsdatasetidfilesfileidmbtilesget) | **GET** /admin/datasets/{datasetId}/files/{fileId}/mbtiles | MBTiles letöltési linkje|
|[**adminDatasetsDatasetIdFilesPost**](#admindatasetsdatasetidfilespost) | **POST** /admin/datasets/{datasetId}/files | TIF fájlok feltöltése|
|[**adminDatasetsDatasetIdGet**](#admindatasetsdatasetidget) | **GET** /admin/datasets/{datasetId} | Adatgyűjtés részletei|
|[**adminDatasetsDatasetIdPatch**](#admindatasetsdatasetidpatch) | **PATCH** /admin/datasets/{datasetId} | Adatgyűjtés módosítása|
|[**adminDatasetsDatasetIdShareDelete**](#admindatasetsdatasetidsharedelete) | **DELETE** /admin/datasets/{datasetId}/share | Megosztási link visszavonása|
|[**adminDatasetsDatasetIdSharePost**](#admindatasetsdatasetidsharepost) | **POST** /admin/datasets/{datasetId}/share | Megosztható link létrehozása|
|[**adminDatasetsGet**](#admindatasetsget) | **GET** /admin/datasets | Saját adatgyűjtések listázása|
|[**adminDatasetsPost**](#admindatasetspost) | **POST** /admin/datasets | Új adatgyűjtés létrehozása|

# **adminDatasetsDatasetIdAttachmentsAttachmentIdDownloadGet**
> SignedUrlResponse adminDatasetsDatasetIdAttachmentsAttachmentIdDownloadGet()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let attachmentId: string; // (default to undefined)

const { status, data } = await apiInstance.adminDatasetsDatasetIdAttachmentsAttachmentIdDownloadGet(
    datasetId,
    attachmentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetId** | [**string**] |  | defaults to undefined|
| **attachmentId** | [**string**] |  | defaults to undefined|


### Return type

**SignedUrlResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsDatasetIdAttachmentsPost**
> DatasetDetail adminDatasetsDatasetIdAttachmentsPost()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let attachments: Array<File>; // (default to undefined)

const { status, data } = await apiInstance.adminDatasetsDatasetIdAttachmentsPost(
    datasetId,
    attachments
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetId** | [**string**] |  | defaults to undefined|
| **attachments** | **Array&lt;File&gt;** |  | defaults to undefined|


### Return type

**DatasetDetail**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Frissített adatgyűjtés mellékletekkel |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsDatasetIdFilesFileIdDownloadGet**
> SignedUrlResponse adminDatasetsDatasetIdFilesFileIdDownloadGet()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let fileId: string; // (default to undefined)

const { status, data } = await apiInstance.adminDatasetsDatasetIdFilesFileIdDownloadGet(
    datasetId,
    fileId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetId** | [**string**] |  | defaults to undefined|
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

**SignedUrlResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsDatasetIdFilesFileIdMbtilesGet**
> SignedUrlResponse adminDatasetsDatasetIdFilesFileIdMbtilesGet()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let fileId: string; // (default to undefined)

const { status, data } = await apiInstance.adminDatasetsDatasetIdFilesFileIdMbtilesGet(
    datasetId,
    fileId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetId** | [**string**] |  | defaults to undefined|
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

**SignedUrlResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsDatasetIdFilesPost**
> DatasetDetail adminDatasetsDatasetIdFilesPost()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let files: Array<File>; // (default to undefined)

const { status, data } = await apiInstance.adminDatasetsDatasetIdFilesPost(
    datasetId,
    files
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetId** | [**string**] |  | defaults to undefined|
| **files** | **Array&lt;File&gt;** |  | defaults to undefined|


### Return type

**DatasetDetail**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Frissített adatgyűjtés a feltöltés után |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsDatasetIdGet**
> DatasetDetail adminDatasetsDatasetIdGet()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)

const { status, data } = await apiInstance.adminDatasetsDatasetIdGet(
    datasetId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetId** | [**string**] |  | defaults to undefined|


### Return type

**DatasetDetail**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Adatgyűjtés adatai |  -  |
|**404** | Nem található |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsDatasetIdPatch**
> DatasetDetail adminDatasetsDatasetIdPatch(datasetUpdateRequest)


### Example

```typescript
import {
    DatasetsApi,
    Configuration,
    DatasetUpdateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let datasetUpdateRequest: DatasetUpdateRequest; //

const { status, data } = await apiInstance.adminDatasetsDatasetIdPatch(
    datasetId,
    datasetUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetUpdateRequest** | **DatasetUpdateRequest**|  | |
| **datasetId** | [**string**] |  | defaults to undefined|


### Return type

**DatasetDetail**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Frissített adatgyűjtés |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsDatasetIdShareDelete**
> adminDatasetsDatasetIdShareDelete()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)

const { status, data } = await apiInstance.adminDatasetsDatasetIdShareDelete(
    datasetId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**204** | Megosztás törölve |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsDatasetIdSharePost**
> ShareTokenResponse adminDatasetsDatasetIdSharePost()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetId: string; // (default to undefined)

const { status, data } = await apiInstance.adminDatasetsDatasetIdSharePost(
    datasetId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetId** | [**string**] |  | defaults to undefined|


### Return type

**ShareTokenResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Megosztási token |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsGet**
> DatasetListResponse adminDatasetsGet()


### Example

```typescript
import {
    DatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let visibility: DatasetVisibility; // (optional) (default to undefined)
let search: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.adminDatasetsGet(
    visibility,
    search
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **visibility** | **DatasetVisibility** |  | (optional) defaults to undefined|
| **search** | [**string**] |  | (optional) defaults to undefined|


### Return type

**DatasetListResponse**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Saját datasetek |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **adminDatasetsPost**
> DatasetDetail adminDatasetsPost(datasetCreateRequest)


### Example

```typescript
import {
    DatasetsApi,
    Configuration,
    DatasetCreateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new DatasetsApi(configuration);

let datasetCreateRequest: DatasetCreateRequest; //

const { status, data } = await apiInstance.adminDatasetsPost(
    datasetCreateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **datasetCreateRequest** | **DatasetCreateRequest**|  | |


### Return type

**DatasetDetail**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Létrehozott adatgyűjtés |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

