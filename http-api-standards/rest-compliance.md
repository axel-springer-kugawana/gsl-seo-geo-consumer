## Endpoint paths

- Paths **MUST** be kebab-case and start with a backslash character (\\).

***Good example***

```yaml
paths:
    /classifieds:
        get:
        operationId: getClassifieds
        summary: Return all the classifieds.
        description: This endpoint allows you retrieve all your classifieds that have been published on Aviv's portals.
 ```

***Bad example***

```yaml
paths:
    /classifieds-data:
        get:
        operationId: getClassifieds
        summary: Return all the classifieds.
        description: This endpoint allows you retrieve all your classifieds that have been published on Aviv's portals.
    /classifiedsData:
 ```

- Paths **MUST NOT** contain a file extension.
- Paths names **MUST NOT** not be a verb.