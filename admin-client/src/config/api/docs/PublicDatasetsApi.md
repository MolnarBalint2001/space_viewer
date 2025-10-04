# PublicDatasetsApi

All URIs are relative to *http://localhost:3000*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**datasetsPublicDatasetIdAttachmentsAttachmentIdDownloadGet**](#datasetspublicdatasetidattachmentsattachmentiddownloadget) | **GET** /datasets/public/{datasetId}/attachments/{attachmentId}/download | Nyilvános melléklet letöltési link|
|[**datasetsPublicDatasetIdFilesFileIdDownloadGet**](#datasetspublicdatasetidfilesfileiddownloadget) | **GET** /datasets/public/{datasetId}/files/{fileId}/download | Nyilvános TIF letöltési link|
|[**datasetsPublicDatasetIdFilesFileIdMbtilesGet**](#datasetspublicdatasetidfilesfileidmbtilesget) | **GET** /datasets/public/{datasetId}/files/{fileId}/mbtiles | Nyilvános MBTiles letöltési link|
|[**datasetsPublicDatasetIdGet**](#datasetspublicdatasetidget) | **GET** /datasets/public/{datasetId} | Nyilvános adatgyűjtés részletei|
|[**datasetsPublicGet**](#datasetspublicget) | **GET** /datasets/public | Nyilvános adatgyűjtések listázása|
|[**datasetsSharedTokenAttachmentsAttachmentIdDownloadGet**](#datasetssharedtokenattachmentsattachmentiddownloadget) | **GET** /datasets/shared/{token}/attachments/{attachmentId}/download | Megosztott melléklet letöltési link|
|[**datasetsSharedTokenFilesFileIdDownloadGet**](#datasetssharedtokenfilesfileiddownloadget) | **GET** /datasets/shared/{token}/files/{fileId}/download | Megosztott TIF letöltési link|
|[**datasetsSharedTokenFilesFileIdMbtilesGet**](#datasetssharedtokenfilesfileidmbtilesget) | **GET** /datasets/shared/{token}/files/{fileId}/mbtiles | Megosztott MBTiles letöltési link|
|[**datasetsSharedTokenGet**](#datasetssharedtokenget) | **GET** /datasets/shared/{token} | Megosztott adatgyűjtés részletei|

# **datasetsPublicDatasetIdAttachmentsAttachmentIdDownloadGet**
> SignedUrlResponse datasetsPublicDatasetIdAttachmentsAttachmentIdDownloadGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let attachmentId: string; // (default to undefined)

const { status, data } = await apiInstance.datasetsPublicDatasetIdAttachmentsAttachmentIdDownloadGet(
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

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **datasetsPublicDatasetIdFilesFileIdDownloadGet**
> SignedUrlResponse datasetsPublicDatasetIdFilesFileIdDownloadGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let fileId: string; // (default to undefined)

const { status, data } = await apiInstance.datasetsPublicDatasetIdFilesFileIdDownloadGet(
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

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **datasetsPublicDatasetIdFilesFileIdMbtilesGet**
> SignedUrlResponse datasetsPublicDatasetIdFilesFileIdMbtilesGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let datasetId: string; // (default to undefined)
let fileId: string; // (default to undefined)

const { status, data } = await apiInstance.datasetsPublicDatasetIdFilesFileIdMbtilesGet(
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

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **datasetsPublicDatasetIdGet**
> DatasetDetail datasetsPublicDatasetIdGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let datasetId: string; // (default to undefined)

const { status, data } = await apiInstance.datasetsPublicDatasetIdGet(
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

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Adatgyűjtés adatai |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **datasetsPublicGet**
> DatasetListResponse datasetsPublicGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let search: string; // (optional) (default to undefined)

const { status, data } = await apiInstance.datasetsPublicGet(
    search
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **search** | [**string**] |  | (optional) defaults to undefined|


### Return type

**DatasetListResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Nyilvános adatgyűjtések |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **datasetsSharedTokenAttachmentsAttachmentIdDownloadGet**
> SignedUrlResponse datasetsSharedTokenAttachmentsAttachmentIdDownloadGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let token: string; // (default to undefined)
let attachmentId: string; // (default to undefined)

const { status, data } = await apiInstance.datasetsSharedTokenAttachmentsAttachmentIdDownloadGet(
    token,
    attachmentId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **token** | [**string**] |  | defaults to undefined|
| **attachmentId** | [**string**] |  | defaults to undefined|


### Return type

**SignedUrlResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **datasetsSharedTokenFilesFileIdDownloadGet**
> SignedUrlResponse datasetsSharedTokenFilesFileIdDownloadGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let token: string; // (default to undefined)
let fileId: string; // (default to undefined)

const { status, data } = await apiInstance.datasetsSharedTokenFilesFileIdDownloadGet(
    token,
    fileId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **token** | [**string**] |  | defaults to undefined|
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

**SignedUrlResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **datasetsSharedTokenFilesFileIdMbtilesGet**
> SignedUrlResponse datasetsSharedTokenFilesFileIdMbtilesGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let token: string; // (default to undefined)
let fileId: string; // (default to undefined)

const { status, data } = await apiInstance.datasetsSharedTokenFilesFileIdMbtilesGet(
    token,
    fileId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **token** | [**string**] |  | defaults to undefined|
| **fileId** | [**string**] |  | defaults to undefined|


### Return type

**SignedUrlResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Aláírt letöltési URL |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **datasetsSharedTokenGet**
> DatasetDetail datasetsSharedTokenGet()


### Example

```typescript
import {
    PublicDatasetsApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicDatasetsApi(configuration);

let token: string; // (default to undefined)

const { status, data } = await apiInstance.datasetsSharedTokenGet(
    token
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **token** | [**string**] |  | defaults to undefined|


### Return type

**DatasetDetail**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Adatgyűjtés adatai |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

