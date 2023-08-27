# Streams documentation and validation

When designing event driven architecures the core concept is Event , an event presents a priviously happened change in the system.

Event driven systems like Apis need promises and contracts but due to the consumption based nature of events their lifecycle differs a bit from Api contracts.

## AsyncApi ?

Using async api we provide specs around Event standards like pub/sub, this way of working, drives us toward the spec first approach and challeng us around Event Storming.

## Validation

The Event Validation is the responsability of both producer and consumer side, but the responsabilty of providig the required material to help the consumer validate the events with minimum effort will be in producer side.

## Consumption

Consuming events has its proper challenges as the different types of can be published to the same broker and the consumer need to decide which one is in its interest, but as well this need a proper way of consumption using filtering and to be able to have a simlified and helpful filtering mecanisme we need to make events based on a well defined standard.

## Lets Validate

You can find a sample asyncapi definition at [here](./lead/v1/asyncapi.yaml).

we need to fetch the json defnition before using ajv using `@asynapi-parser` package , the implementation can be find [here](./asyncapi-schema-validator.js).

## Schema Generator

The Shema can be parsed via file or url , the generator translate the asyncapi into a typescript const.

The validation involve verifing the event against a path to schema component in generated schema. [here](./asyncapi-typescript-schema-generator.ts)

### Why we need a shcema?

The process of validation must be consucted by asyncapi specification, so for any single event we need to validate that event against the specification. Vlaidating against a url or file add some hard dependency for a simple validation to the network or I/O.

### How do that?

#### From file

To lighten the validation process we generae a typescript variable consisting of json schema from out asyncapi in developement phase using following command

``` shell
    > cd tools
    > npm i & npm run generate-schema -- -p=../docs/Order -v=1.0.0 -o=./
```

The genrated schema file name is by defalt `asyncapi-genrated-schema.ts`

#### From URI

> you can as well generate a schema form an api definition uing http/https Url

``` shell
    npm run generate-schema -- -p=https://asyncapi.com -v=1.0.0 -o=./
```

## Generation Alternative way

You can as well do a simple parsing of asyncapi yaml file to json using the online free tools and create a variable in your code source manualy.

Here some online free tools:

- https://onlineyamltools.com/convert-yaml-to-json
- https://jsonformatter.org/yaml-to-json
- https://www.json2yaml.com/convert-yaml-to-json
