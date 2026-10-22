# FitMirror AI frontend API contract

## Status

The frontend is prepared to call the endpoints below. The backend route, controller, and package files in this workspace are currently empty, so these are **proposed response contracts**, not verified backend behavior. Implement and validate them in the backend before enabling production use. The frontend never treats an empty or unknown response as a successful AI result.

Configure the API root before the deferred `js/api.js` script runs by defining `window.FITMIRROR_API_BASE` (default: `/api`). The health endpoint is requested from the same origin at `/health`.

Upload size limits can be configured before `js/upload.js` runs with `window.FITMIRROR_UPLOAD_LIMITS = { garment: <bytes>, person: <bytes> }`. Defaults are 8 MiB for clothing images and 10 MiB for personal photographs. The backend must enforce its own matching or stricter limits.

## Requests

| Method | Path | Request |
| --- | --- | --- |
| `POST` | `/api/products/extract` | JSON `{ "url": "https://..." }` |
| `POST` | `/api/uploads/person` | `multipart/form-data`, field `personImage` |
| `POST` | `/api/tryon` | `multipart/form-data`, fields `personImage`, `garmentImage` (or `garmentImageUrl`), `category`, and optional `productUrl` |
| `GET` | `/api/tryon/:id` | Session identifier in the URL |
| `GET` | `/api/history` | Optional `cursor` query parameter |
| `DELETE` | `/api/history/:id` | Session identifier in the URL |
| `GET` | `/health` | No body |

The browser sends the person and garment together to `/api/tryon` so one request represents the consented generation action. The standalone person-upload helper is available for a backend workflow that prefers a separate upload step; it is not called by the current try-on flow.

## Proposed successful responses

Product extraction should return either a direct product object or `{ "product": { ... } }` with an absolute HTTP(S) `imageUrl` (or `image`) and optional `name`/`title`, `brand`, `price`, and `category`. If no usable image URL is returned, the UI reports extraction failure and offers manual image upload.

A try-on request or status lookup should return a session identifier (`id`, `_id`, or `sessionId`) and a status such as `queued`, `processing`, `completed`, or `failed`. When complete, include an absolute HTTP(S) result URL as `resultImageUrl`, `imageUrl`, `outputImageUrl`, or `result.image.url`. A completed status without an image URL is displayed as an error, not as a successful preview. The UI polls an identified session for up to two minutes.

History should return `{ "sessions": [], "nextCursor": null }`. A session may include `id`/`_id`/`sessionId`, `status`, `createdAt`, `category`, `productName`, and a result URL (`resultImageUrl`, `imageUrl`, or `outputImageUrl`). If `nextCursor` is present, the frontend offers a Load more action. Deletion should return a successful HTTP status (including `204`) only after the session deletion is complete.

For errors, return a non-2xx status and preferably JSON such as `{ "message": "A user-safe explanation", "code": "OPTIONAL_CODE" }`. The frontend also handles a plain-text error body, request timeouts, and network failures. Do not include credentials or private storage details in public error messages.

## Privacy and validation

The frontend checks URL format, image MIME type, and maximum size (8 MB garment, 10 MB person), but these checks are not security boundaries. The backend must independently validate uploads, authorization, request size, URL safety, and model/service errors. Do not return private credentials to the browser. Confirm image storage, retention, deletion, and third-party processing behavior before production deployment.