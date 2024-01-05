### Robustness principle 

Every API **MUST** follow robustness principles AKA postel'law principle:

> Be conservative in what you send, be liberal in what you accept.

* APIs should not send more data than required. 
* Clients should be tolerant when consuming other services.

### API Surface

* Every API **MUST** follow YAGNI principle:

    * APIs **SHOULD** be Minimal with a minimal surface while adhering to to product requirements. 
    * APIs **SHOULD NOT** expose unnecessary resources, relations, actions or data.
    * APIs **SHOULD NOT** add functionality until deemed necessary


* APIs **MUST NOT** expose a system's internals (e.g. exposing internal bounded context models or  internal features) and **MUST** apply information hiding design (aka encapsulation) principle
* Clients **SHOULD NOT** depend upon implicit interface


### API Versioning

Modifications to existing internal APIs **SHOULD** avoid breaking changes and **SHOULD** maintain backward compatibility:
* APIs **MUST** use semantic versioning to indicate the level of changes

* No breaking changes: 
    * News minor versions of API contracts **SHOULD** be processed by older versions of clients without breaking
    * A change is considered backwards compatible when optional new features are added to an API. A Client must tolerate such minor updates.
    * APIs **MUST** avoid renaming or removing or changing field types when possible.
    * APIs **MUST NOT** make optional things required
    * Any new addition **MUST** be optional 

* In the case of breaking change, APIs **MUST** support multiple versions with a clear and agreed upon deprecation strategy for older version:
    * Deprecation strategy **MUST** be documented by API owners and communicated to their clients.
    * internal APIs owners **SHOULD** maintain 2 API versions at max.

* Sunsetting old API Versions:
    * A sunset notice **SHOULD** be clearly indicated both in the documentation and at runtime.
        * At runtime, [HTTP Sunset header](https://datatracker.ietf.org/doc/html/rfc8594) **MUST** be used
        * API clients **MUST** be noticed. They **SHOULD** be informed about the migration path and alternatives for the deprecated feature.

### JSON based payloads

JSON-based message **MUST** conform to these rules:

* Fields **MUST** follow `camelCase` convention
* Bool fields **MUST NOT** be of null value
* Null fields value **SHOULD** be omitted
* Empty arrays and **SHOULD NOT**  be null (e.g. they should be `[]`)
* Fields of type array  **SHOULD** be plural (e.g. `classifieds: [...]`, `agencies: [...]`)

###  Concurrency control and optimistic locking

To avoid the [lost update problem](https://en.wikipedia.org/wiki/Concurrency_control#Why_is_concurrency_control_needed?:~:text=The%20lost%20update%20problem), APIs **MAY** consider implementing [optimistic locking](https://en.wikipedia.org/wiki/Optimistic_concurrency_control). APIs owners **SHOULD**  use *ETag* header and [conditional HTTP requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests): 
* APIs **MUST** manage a concurrency token associated to the resource (e.g. version or hash)
* This concurrency token **MUST** be exposed by the API as the `ETag` header on read operations. 
* Clients **MUST** execute write operations with an `If-Match` header containing the value of `Etag` header handled by the last read operation. The API is then required to verify that the provided `If-Match` value corresponds to the resource's concurrency token in it's data store before approving the changes.
* `If-Match` header can be used with `POST`, `PUT`, `PATCH`and `DELETE` operations. 
