import Ajv from "ajv";
import addFormats from "ajv-formats";
import { schema } from "@shared/schemas/classifieds/1.0.0/asyncapi";
import { ClassifiedCensoredEvent, ClassifiedCreatedEvent } from "@shared/models/classifieds/1.0.0/models";



const ajv = new Ajv({
    allErrors: true,
    allowUnionTypes: true,
// following this sample, ajv consider some of cloudevent properties as additional eventhough they are part of the event envelop (due to the use of allOf on the asyncapi schema)
// ajv mutates objects that are provided into the validator and removes the additional properties (if this property is set to true in its .ctor)
// when validating an envelop we will need to clone it, we ensure that ajv do not mutate the original object that is provided as argument of the validation
// SEE: https://github.com/ajv-validator/ajv/issues/1231   
    removeAdditional: true,
});


addFormats(ajv);
ajv.addVocabulary([
    'asyncapi',
    'info',
    'servers',
    'channels',
    'components',
    'x-parser-api-version',
    'x-parser-spec-parsed',
    'x-parser-schema-id',
    'x-parser-circular',
    'x-parser-message-parsed',
    'x-parser-original-traits',
    'x-parser-original-schema-format',
    'x-parser-message-name',
    'x-parser-original-payload',
]);


const classifiedCreatedEventValidator = ajv.compile(schema.components.schemas.ClassifiedCreatedEvent);
const classifiedCensoredEventValidator = ajv.compile(schema.components.schemas.ClassifiedCensoredEvent);

export const validateClassifiedCreatedEvent = (data: any) => {
    // see comment on top ;)
    const dataCopy = JSON.parse(JSON.stringify(data));
    const valid = classifiedCreatedEventValidator(dataCopy);

    if(!valid) {
        return {
            valid: false,
            errors: classifiedCreatedEventValidator.errors
        }
    } else {
        return {
            valid: true,
            event: data as ClassifiedCreatedEvent
        }
    }

}

export const validateClassifiedCensoredEvent = (data: any) => {
    // see comment on top ;)
    const dataCopy = JSON.parse(JSON.stringify(data));
    const valid = classifiedCensoredEventValidator(dataCopy);

    if(!valid) {
        return {
            valid: false,
            errors: classifiedCensoredEventValidator.errors
        }
    } else {
        return {
            valid: true,
            event: data as ClassifiedCensoredEvent
        }
    }
}