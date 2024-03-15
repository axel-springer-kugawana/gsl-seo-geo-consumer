## API design principles

# Robustness principle

Every API **MUST** follow robustness principles AKA [Postel's law principle](https://en.wikipedia.org/wiki/Robustness_principle):

> Be conservative in what you send, be liberal in what you accept.

* APIs should not send more data than required.
* Clients should be tolerant when consuming other services.

# API Surface

* Every API **MUST** follow YAGNI principle:

    * APIs **SHOULD** be Minimal with a minimal surface while adhering to to product requirements
    * APIs **SHOULD NOT** expose unnecessary resources, relations, actions or data.
    * APIs **SHOULD NOT** add functionality until deemed necessary


* APIs **MUST NOT** expose a system's internals (e.g. exposing internal bounded context models or  internal features) and **MUST** apply information hiding design (aka encapsulation) principle
* Clients **SHOULD NOT** depend upon implicit interface


# API Versioning

Modifications to existing internal APIs **SHOULD** avoid breaking changes and **SHOULD** maintain backward compatibility:

* APIs **MUST** use semantic versioning to indicate the level of changes

* No breaking changes:
    * News minor versions of API contracts **SHOULD** be processed by older versions of clients without breaking.
    * A change is considered backwards compatible when optional new features are added to an API. A Client must tolerate such minor updates.
    * APIs **MUST** avoid renaming or removing or changing field types when possible (otherwise, this is a breaking change).
    * APIs **MUST NOT** make optional things required.
    * Any new addition **MUST** be optional.

* In the case of breaking change, APIs **MUST** support multiple versions with a clear and agreed upon deprecation strategy for older version:
    * Deprecation strategy **MUST** be documented by API owners and communicated to their clients.
    * Internal APIs owners **MUST** maintain 2 API versions at max.

* Sunsetting old API Versions:
    * A sunset notice **SHOULD** be clearly indicated both in the documentation and at runtime.
        * At runtime, [HTTP Sunset header](https://datatracker.ietf.org/doc/html/rfc8594) **MUST** be used
        * API clients **MUST** be noticed. They **SHOULD** be informed about the migration path and alternatives for the deprecated feature.
*  API Version **MUST** be visible on the request path and **MUST** be the first element on the resource path

    ```
    GET /<major-version>/<resource>/...
    GET /v1/classifieds
    ```

* For internal APIs, environment names **SHOULD** be included in the subdomain name:

    ```
    https://<capability?>-<api-name>-<env>.<account>.aws.aviv-internal.eu/
    ```

# JSON based payloads

JSON-based message **MUST** conform to these rules:

* Fields **MUST** follow `camelCase` convention
* Bool fields **MUST NOT** be of null value
* Null fields value **SHOULD** be omitted
* Empty arrays and **SHOULD NOT**  be null (e.g. they should be `[]` or should be omitted when the property is null)
* Fields of type array  **SHOULD** be plural (e.g. `classifieds: [...]`, `agencies: [...]`)

# Concurrency control and optimistic locking

To avoid the [lost update problem](https://en.wikipedia.org/wiki/Concurrency_control#Why_is_concurrency_control_needed?:~:text=The%20lost%20update%20problem), APIs **MAY** consider implementing [optimistic locking](https://en.wikipedia.org/wiki/Optimistic_concurrency_control). APIs owners **SHOULD**  use *ETag* header and [conditional HTTP requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests): 
* APIs **MUST** manage a concurrency token associated to the resource (e.g. version or hash)
* This concurrency token **MUST** be exposed by the API as the `ETag` header on read operations.
* Clients **MUST** execute write operations with an `If-Match` header containing the value of `Etag` header handled by the last read operation. The API is then required to verify that the provided `If-Match` value corresponds to the resource's concurrency token in it's data store before approving the changes.
* `If-Match` header can be used with `POST`, `PUT`, `PATCH`and `DELETE` operations.

# Idempotency

Idempotency ensures that performing the same operation multiple times has the same result as performing it once. Idempotency is a crucial concept for designing robust, fault tolerant and predictable APIs.

* Idempotent HTTP Methods:
   * **GET** requests are read operations and **MUST NOT** produce side effects.
   * **MUST**: Design **PUT** requests to be idempotent. Subsequent identical requests should have the same effect as a single request.
   * **MUST**: Make **DELETE** requests idempotent. Repeating the same request should not have additional side effects.
* Non idempotent HTTP Methods **POST** & **PATCH**
   * **SHOULD**: Strive to make non-safe methods idempotent where possible.
   * **MUST**: Clearly document the idempotent behavior of each non-safe method.

* Idempotency Key:
   * Idempotency key is a unique value generated by API clients. Resource server uses idempotency key to identify subsequent retries of the same request
   * **MUST**: Implement idempotency key for operations that are not inherently idempotent, such as POST & PATCH operations.
   * **SHOULD**: Include [Idempotency-Key](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/) HTTP Header in the request header for non-idempotent operations.
   * **MAY**: Use V4 UUIDs, or another random string with enough entropy to avoid collisions

* Documentation
   * **MUST** : Clearly document which API endpoints and operations are idempotent.
   * **SHOULD**: Include examples and use cases demonstrating idempotency in API documentation.
   * **SHOULD**: Document expiration based on idempotency key

# Pagination

When exposing a collection resource, incorporating pagination into your API design is essential. In fact, predicting the precise amount of data to be returned is often not straightforward.
Therefore, APIs **SHOULD** handle of resource pagination, including specifying default values in cases where they are not explicitly provided by the client.

when possible, a collection resource **SHOULD** provide navigation links for navigating within the collection. These links enable clients to navigate through the paginated results. Simplifying client's job in constructing URLs for subsequent requests.

## Offset vs Token based pagination

* Offset-based pagination relies on specifying a numerical offset, and generally a limit, to determine where a set of results should begin, allowing clients to request subsequent pages by incrementing or decrementing this offset.

* Offset-based pagination is simple to implement, it is most suited in these cases:

    * Ordered data
    * Small dataset

    Example

    ```
    GET /classifieds?offset=20&limit=15
    ```

* In token-based pagination, a unique token is used to represent a specific point in the dataset, enabling clients to retrieve subsequent pages by providing this token rather than relying on numerical offsets.

* Token based pagination is most suited in these cases:

    * Large datasets
    * Cursor stability is required, * i.e.* Cursors remain valid even if the underlying data changes, as long as the cursor points to a valid position in the dataset

    Example

    ```
    GET /classifieds?start=VGhpcyBpcyBhIHBhZ2luYXRpb24gdG9rZW4=&limit=50
    ```
* Paginated Response Payload
    * *Offset based pagination*

        ```
        {
            "meta": {
                "count": "The total count of the items. (Optional)"
            },
            "links": {
                "prev": "relative url to get to previous page (When applicable)",
                "next": "relative url get to next page",
                "first": "relative url to get to the first page (Should)",
                "last": "relative url to get to the last page (When applicable)"
            },
            "classifieds": [{
                ...object
            }, {
                ...object
            }]
        }
        ```
    * *Token based pagination*
        ```
        {
            "links": {
                "next": "relative url get to next page",
                "first": "relative url to get to the first page (Optional)"
            },
            "classifieds": [{
                ...object
            }, {
                ...object
            }]
        }
        ```

# API Documentation

## MUST provide API documentation using OpenAPI

- The API documentation **MUST** be written in a clear and concise language that is easy to understand for both technical and non-technical audiences.

- The API documentation **MUST** be comprehensive and include all of the information that a developer needs to use the API, such as :
    - the endpoints
    - theparameters
    - the responses
    - the error messages

- The API documentaiton **MUST** include the following field : `x-aviv-service`. The value **MUST** conform to this format `<Domain>.<Capability or Experience>.<Context>`.

Examples : `seeker.classified-details.classified-details-service`  or `seeker.seo.link-box`.

- The API documentation **MUST** be up-to-date and reflect any changes that are made to the API.

- OpenAPI **MUST** be used as a standard way to define REST API documentations.

- The API documentation **MUST** be written using a self-contained YAML file.

- OpenAPI version 3 and more **MUST** be used.

|   | OpenAPI 3.0.x   | OpenAPI 3.1.x   |
|---|---|---|
| JSON Schema support  | Partial  | Full  |
| 3rd party tooling support  | Full  | Partial  |
| Adoption  | High  | Growing  |

- OpenAPI version 3.0.x **SHOULD** be used as support for 3.1.x is not sufficient.

- An API **MUST** provide a documentation per version and environment

- REST API documentations **MUST** be exposed  internally via a bundled HTMl file.

- This bundled HTML file **MUST** be generated using[Swagger UI](https://github.com/swagger-api/swagger-ui).

> [!NOTE]
> To help design easily API documentations, it is *RECOMMENDED* to use [Swagger Editor](https://editor.swagger.io/) and the [OpenAPI mind map](https://openapi-map.apihandyman.io/?version=3.0).

- The API documentation **MUST** be available on the [AVIV Service Catalog](https://aviv.roadie.so/)

- The raw API documentation specification **MUST** be able to be downloaded from the HTML bundled file.

## MUST provide an API overview documentation using Markdown

- The API overview documentation **MUST** be written in a clear and concise language that is easy to understand for both technical and non-technical audiences.
- The API overview documentation **MUST** be provided as a separate file from the API documentation.
- The API overview documenation **SHOULD** also include the following sections :
    - an introduction expliciting what the API is about
    - a contact email
    - an authentication part expliciting :
        - the authentication scheme(s) used by the API
        - the list of scopes needed to use the API if relevant
    - an API overview expliciting :
        - the naming conventions
        - the glossary
        - the versioning strategy
        - the supported HTTP status codes
        - any specific information about the API
    - the list of custom errors expliciting with an human readable documentation
    - a changelog
    - a migration guide from the previous relevant version
- The API overview documentation **MUST** be up-to-date and reflect any changes that are made to the API.
- The API overview documentation **MUST** be available on the [AVIV Service Catalog](https://aviv.roadie.so/)

# REST compliance

## Endpoint paths

- Paths **MUST** be `kebab-case` (also known as `spinal-case`) and start with a backslash character (`\`).

***Good example***

```yaml
paths:
    /classifieds:
        get:
            operationId: get-classifieds
            summary: Return all the classifieds.
            description: This endpoint allows you retrieve all your classifieds that have been published on AVIV's portals.
    /classifieds-data:
        get:
            operationId: getClassifieds
            summary: Return all the classifieds.
            description: This endpoint allows you retrieve all your classifieds that have been published on AVIV's portals.
 ```

***Bad example***

```yaml
paths:
    /classifiedsData:
        get:
            operationId: get-classifieds
            summary: Return all the classifieds.
            description: This endpoint allows you retrieve all your classifieds that have been published on AVIV's portals.
 ```

- Paths **MUST NOT** contain a file extension.
- Paths names **MUST NOT** not be a verb (no remote procedure calls).

***Bad example***

```yaml
paths:
    /publish:
        post:
            operationId: publish-classified
            summary: Publish a classified.
            description: This endpoint allows you retrieve all your classifieds that have been published on Aviv's portals.
 ```
- Paths representing a query collection **MUST** be pluralized.

***Good example***

```yaml
paths:
    /classifieds:
        get:
            operationId: get-classifieds
            summary: Return all the classifieds.
            description: This endpoint allows you retrieve all your classifieds that have been published on AVIV's portals.
 ```

***Bad example***

```yaml
paths:
    /classified:
        get:
            operationId: get-classifieds
            summary: Return all the classifieds.
            description: This endpoint allows you retrieve all your classifieds that have been published on AVIV's portals.
 ```

- Child resources **MUST** be nested. If a child resource is only accessible via its parent resource and may not exist without parent resource, a nested URL structure must be used.

If the resource can be accessed directly via its unique id, then the API **MUST** expose it as a top-level resource

***Good example***

```yaml
paths:
    /classifieds:
        get:
            operationId: get-classifieds
            summary: Return all the classifieds.
            description: This endpoint allows you retrieve all your classifieds that have been published on AVIV's portals.
    /classifieds/{classifiedId}:
        get:
            operationId: get-classifieds-by-id
            summary: Return a classified.
            description: This endpoint allows you retrieve a classified that have been published on AVIV's portals.
    /classifieds/{classifiedId}/media:
        get:
            operationId: get-all-classified-media-by-id
            summary: Return all the media belonging to a specific classified.
            description: This endpoint allows you retrieve all the media attached to a classified.
     /classifieds/{classifiedId}/media/{mediaId}:
        get:
            operationId: get-classified-media-by-id
            summary: Return a media belonging to a specific classified.
            description: This endpoint allows you retrieve a specific media attached to a classified.
 ```

## Endpoints methods
- All the API endpoints methods **MUST** be one of :
    - POST
    - GET
    - PUT
    - PATCH
    - DELETE
    - HEAD
 - The POST method **MUST** be used to create one or multiple new resources.
    - By using POST to create resources the resource identifier **MUST NOT** be passed as request input date by the client, but created and maintained by the service and returned with the response payload.
    - Posting the same resource twice is not required to be idempotent and may result in multiple resources. However, a POST or PATCH endpoint **SHOULD** be designed in an idempotent way to prevent this.
- The GET method **MUST** be used to read either a single or a collection resource and should have no other effect on the data.
    - The GET endpoint **MUST NOT** expose a `requestBody`.
- The PUT method **MUST** be used to update fully one resource.
    - The PUT method **MUST NOT** be used to update multiple resources (collection of resources).
    - The PUT method **MUST NOT** be robust against non-existence of resources by implicitly creating the resource before updating. Non-existence **MUST** trigger an error.
    - The updated resource **MUST** be returned as part of the reponse payload.
- The PATCH method **MUST** be used to update partially a resource.
    - The PATCH method **MUST NOT** be used to update multiple resources (collection of resources).
    - The PATCH method **MUST NOT** be robust against non-existence of resources by implicitly creating the resource before updating. Non-existence **MUST** trigger an error.
    - The updated resource **MUST** be returned as part of the reponse payload.
    - The PATCH method **MUST** require the usage of the [JSON Patch standard (RFC 6902)](https://datatracker.ietf.org/doc/html/rfc6902) which includes instruction on how to update the resource :
        - The media type **MUST** be `application/json-patch+json; charset=utf-8`.
        - The JSON Patch document **MUST** be a JSON representing an array of operations objects.
        - Operations **MUST** have exactly one `op` member. Its value **MUST** be one of :
            - `add`
            - `remove`
            - `replace`
            - `move`
            - `copy`
         - The `add` operation object **MUST** contain a `value` member whose content specifies the value to be added.
        - The `add` operation object **MUST** contain a `path` member whose content specifies the target location.
        - The `add` operation **MUST** be used to target location of a specific array index. The new value is then inserted into the array at the specified index.
        - The `add` operation **MUST** be used to target location of a specific object member that does not already exists. The new member is then inserted to the existing object.
        - The `add` operation **MUST** be used to target location of a specific object member that does already exists. The member value is then replaced by the new value.
        - The `add` operation `path` member **MUST** be one of :
            - A member to add to an existing object.
            - An element to add to an existing array. Any elements at or above the specified index are shifted one position to the right.  The specified index **MUST NOT** be greater than the number of elements in the array.  If the `-` character is used to index the end of the array (see [RFC6901](https://datatracker.ietf.org/doc/html/rfc6901)), this has the effect of appending the value to the array.
        - The `add` operation `path` member **MUST NOT** be the root of the target document. The PUT method **MUST** be used instead.
        - The `remove` operation object **MUST** contain a `path` member whose content specifies the target location. The target location **MUST** exists for the operation to be successful. If removing an element from an array, any elements above the specified index are shifted one position to the left.
        - The `replace` operation object **MUST** contain a `value` member whose content specifies the value to be replaced.
        - The `replace` operation object **MUST** contain a `path` member whose content specifies the target location.
        - The `move` operation object **MUST** contain a `from` member which is a string containing a JSON Pointer value that references the location in the target document to move the value from. The `from` location **MUST NOT** be a proper prefix of the `path` location ;  meaning that a location cannot be moved into one of its children.
        - The `move` operation object **MUST** contain a `path` member whose content specifies the target location.
        - The `copy` operation object **MUST** contain a `from` member which is a string containing a JSON Pointer value that references the location in the target document to copy the value from. The `from` location **MUST** exists for the operation to be successful.

        - ***Example***

        ```json
        [
            {
                "op": "remove",
                "path": "/a/b/c"
            },
            {
                "op": "add",
                "path": "/a/b/c",
                "value": [
                    "foo",
                    "bar"
                ]
            },
            {
                "op": "replace",
                "path": "/a/b/c",
                "value": 42
            },
            {
                "op": "move",
                "from": "/a/b/c",
                "path": "/a/b/d"
            },
            {
                "op": "copy",
                "from": "/a/b/d",
                "path": "/a/b/e"
            }
        ]
        ```
- The DELETE method **MUST** be used to delete a resource.
    - The DELETE method **MUST NOT** be used to delete multiple resources (collection of resources).
    - The DELETE endpoint **MUST NOT** expose a `requestBody`.
    - The DELETE endpoint **MUST NOT** expose query parameters.
- The HEAD method **MUST** be used to retieve the header information of a resource
    - The HEAD method **MUST NOT** be used to retieve the header information of multiple resources (collection of resources).
    - The HEAD endpoint **MUST NOT** expose a `requestBody`.

## Headers

- Supported headers **MUST** be explicitly specified in the documentation.
- Headers **MUST** be part of list of non-obselete RFC (see [the list of standard HTTP headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)).
- Headers **MUST** have a description.
- Headers **MUST NOT** be prefixed with `X-`, `x-` or any other custom naming.
- Headers **MUST** Every HTTP Header should use `Hyphenated-Pascal-Case` format.

```yaml
Some-Request-Metadata-Header: FooBar42
```

### Request headers

- Every request **MAY** define an *optional* `traceparent` header. The traceparent header is defined as such :

```yaml
components:
    parameters:
        traceparentHeader:
            name: traceparent
            in: header
            required: false
            description: Identifies the incoming request in the tracing system
            example: a-random-string
            schema:
                type: string
                minLength: 0
                maxLenght: 32
```
The value is a string defined by the client for each requests made.
- Every request **MUST** define, if applicable, at least one required `Content-Type` header. The value **MUST** always be one of the following :
    - `application/json; charset=utf-8`
    - `application/json-patch+json; charset=utf-8`
    - `application/octet-stream`

### Response headers

- Every defined request response **SHOULD** provide a `traceparent` header only when responding to systems that participated in the trace. The traceparent header is defined as such:

```yaml
components:
    headers:
        traceparent:
            description: Identifies the request in the tracing system
            required: false
            example: 00-0af7651916cd43dd8448eb211c80319c-b9c7c989f97918e1-01
            schema:
                type: string
                minLength: 0
                pattern: ^[\da-f]{2}-[\da-f]{32}-[\da-f]{16}-[\da-f]{2}$
```

The value is a string defined by the API server for each requests answered, base either on the traceparent header value provided by the client if applicable or a new value randomly generated.

- Every request response **MUST** define a required `Content-Type` header. The value **MUST** always be `application/json; charset=utf-8`.


## Query parameters

- query parameters


# Error handling

- Errors responses **MUST** comply with the [RFC 9457](https://datatracker.ietf.org/doc/html/rfc9457) which defines a a data model for problem details in JSON.
- Error responses **MUST** have a `application/problem+json; charset=utf-8` Content-Type.
- Error responses **MUST** include a `type` member.
    - The `type` member **MUST** have an `URI` as value that identifies the problem type. The URI **SHOULD** reference a human-readable documentation for the problem type.
    - When the problem has no additional semantics beyond that of the HTTP status code, the `type` value **MUST** be `about:blank`.
    - The `type` member **MUST** resolve to an HTML documentation that explains how to resolve the problem.
- Error responses **MUST** include a `status` member.
    - The `status` member **MUST** have a `status code` as value that indicates the HTTP status code generated by the origin server for this occurrence of the problem.
- Error responses **MUST** include a `title` member.
    - The `title` member **MUST** include a short, human-readable summary of the problem type.
    - The `title` **MUST NOT** change from occurrence to occurrence of the problem, except for localization.
    - When the problem has no additional semantics beyond that of the HTTP status code, the `title` value **SHOULD** be the name of the HTTP status code.
- Error responses **MUST** include a `detail` member.
    - The `detail` member **MUST** include a human-readable explanation specific to this occurrence of the problem.
    - The `detail` member is not meant to be parseable by the client machine.
- Error responses **MUST** include an `instance` member.
    - The `instance` member **MUST** have an `URI` as value that serves as a unique identifier for the problem occurrence that may be of significance to the server but is opaque to the client.
    - The instance URI **SHOULD** not be dereferenceable.


## Extensions members

- Problem type definitions **MAY** extend the problem details object with additional members that are specific to that problem type.
    - When extensions members are used, the `type` member value **MUST NOT** be `about:blank`.

## OpenApi specification

Here is a the openapi specification of the compliant ErrorResponse model that can be extended with extension members :

```yaml
ErrorResponse:
    description: "Represents an error"
    additionnalProperties: true
    type: "object"
    required:
    - title
    - type
    - status
    - detail
    - instance
    properties:
    type:
        type: "string"
        description: |
        The URI reference that identifies the problem type. The "about:blank" URI, when used as a problem type, indicates that the problem has no additional semantics beyond that of the HTTP status code
        example: "{{API_DOC_URL}}#section/Errors/Validation-Error"
        nullable: false
        minLength: 1
    title:
        description: "An human-readable summary of the problem type"
        type: "string"
        example: "Bad request"
        nullable: false
        minLength: 1
    detail:
        description: "A human-readable explanation specific to this occurrence of the problem"
        type: "string"
        example: "Your request has not been validated"
        nullable: false
        minLength: 1
    instance:
        description: "A URI reference that identifies the specific occurrence of the problem"
        example: 00-0af7651916cd43dd8448eb211c80319c-b9c7c989f97918e1-01
        type: string
        nullable: false
        minLength: 1
    status:
        description: "The HTTP status code generated for this occurrence of the problem"
        type: "number"
        example: 400
        nullable: false
        minLength: 1
```

## Example

- An error response with two extenstion members (`errors` and `errorSource`):

```json
{
    "type": "https://api.my-cool-example.com/doc/index.html#section/Errors/Validation-Error",
    "title": "Bad request",
    "detail": "Your request has not been validated",
    "instance": "00-0af7651916cd43dd8448eb211c80319c-b9c7c989f97918e1-01",
    "status": 400,
    "errors": [
        {
            "name": "/data/estateSubTypes/trading",
            "reason": "must be equal to one of the allowed values: STORE, SHOWROOM_SPACE, SHOPPING_CENTRE, KIOSK, SALES_AREA."
        }
    ],
    "errorSource": "body"
}
```

- An error response where the problem has no additional semantics beyond that of the HTTP status code :

```json
{
    "type": "about:blank",
    "title": "Not found",
    "detail": "The resource you are trying to operate with doesn't exists: 5c597a63-6932-4b0c-a2a0-2fd935be175.",
    "instance": "00-0af7651916cd43dd8448eb211c80319c-b9c7c989f97918e1-01",
    "status": 404
}
```


## HTTP Status Codes

HTTP status codes are the most important indicator of errors in REST APIs.

The five categorie of HTTP Status Code are :

* 100-level (Informational) – server acknowledges a request
* 200-level (Success) – server completed the request as expected
* 300-level (Redirection) – client needs to perform further actions to complete the request
* 400-level (Client error) – client sent an invalid request
* 500-level (Server error) – server failed to fulfill a valid request due to an error with server

Based on the response code, a client can guess the outcome of a particular request.

### Handling error

Out of five categories of HTTP status codes above, two are used for errors:

* 400 range: Client Errors - where something is wrong on the user's end
* 500 range: Protocol Errors - indicating issues from within in terms of fault processing.

### Basic responses

The simplest way to handle errors is to respond with an appropriate status code.

Here are some common response codes:

* 400 Bad Request – client sent an invalid request, such as lacking required request body or parameter
* 401 Unauthorized – client failed to authenticate with the server
* 403 Forbidden – client authenticated but does not have permission to access the requested resource
* 404 Not Found – the requested resource does not exist
* 412 Precondition Failed – one or more conditions in the request header fields evaluated to false
* 500 Internal Server Error – a generic error occurred on the server
* 503 Service Unavailable – the requested service is not available

