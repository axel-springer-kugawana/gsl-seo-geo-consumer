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

- REST API documentations **MUST** be exposed both internally and publicly via a bundled HTMl file.

- This bundled HTML file **MUST** be generated either by using [Redoc](https://github.com/Redocly/redoc) or [Swagger UI](https://github.com/swagger-api/swagger-ui).

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