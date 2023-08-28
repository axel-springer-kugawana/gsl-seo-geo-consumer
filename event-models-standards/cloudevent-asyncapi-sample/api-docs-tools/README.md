
# Generating Schemas & models from AsyncAPI specification

A code generation tool is essential in the API contract-first approach to automatically create consistent and accurate code structures based on the defined contract, ensuring seamless integration and reducing manual coding errors.

In order to simplify handling asyncapi sepc, you can find here two scripts

* [gen-ts-schema-from-asyncapi-spec.ts](./gen-ts-schema-from-asyncapi-spec.ts): Generates a typescript definition of the asyncapi.yml spec. This has the adventage to have the "spec as code" directly into your application enabling better discovrability and schema manipulation in your code. This script uses asyncapi's [parser-js](https://github.com/asyncapi/parser-js) tool.

* [gen-ts-types-from-asyncapi-spec.ts](./gen-ts-types-from-asyncapi-spec.ts): Generates typescript models from the asyncapi.yml spec. This script uses uses asyncapi's [modelina](https://www.asyncapi.com/tools/modelina)

You can find how these scripts are used here [package.json](./package.json): 
- generate-ts-schema
- generate-models

feel free to adapt them to your own usecases.



