## Endpoint paths

- Paths **MUST** be kebab-case (also known as spinal-case) and start with a backslash character (\\).

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

        ***Good example***

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

- Every defined request response **MUST** provide a `traceparent` header. The traceparent header is defined as such :

```yaml
components:
    headers:
        traceparent:
            description: Identifies the request in the tracing system
            required: true
            example: 00-0af7651916cd43dd8448eb211c80319c-b9c7c989f97918e1-01
            schema:
                type: string
                minLength: 0
                pattern: ^[\da-f]{2}-[\da-f]{32}-[\da-f]{16}-[\da-f]{2}$
```
The value is a string defined by the API server for each requests answered, base either on the traceparent header value provided by the client if applicable or a new value randomly generated.
- Every request response **MUST** define a required `Content-Type` header. The value **MUST** always be `application/json; charset=utf-8`.


### Query parameters

- query parameters 
