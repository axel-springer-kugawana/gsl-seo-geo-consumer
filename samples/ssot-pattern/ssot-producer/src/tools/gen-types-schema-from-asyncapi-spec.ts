import { Parser, fromFile } from "@asyncapi/parser";
import {
  FormatHelpers,
  typeScriptDefaultEnumKeyConstraints,
  TypeScriptGenerator
} from '@asyncapi/modelina';

export const generateAsyncAPISchemaFileContent = async (asyncAPISpecFile: string) => {

  const asyncapiParser = new Parser();
  const parseOutput = await fromFile(asyncapiParser, asyncAPISpecFile).parse();
  const schema = parseOutput.document?.json() ?? {};
  const fileContent = `export const schema=${JSON.stringify(schema, null, 2)}`

  return fileContent;

}

export const generateTsTypesFromAsyncAPISpec = async (asyncAPISpec: string) => {

  const generator = new TypeScriptGenerator({
    modelType: 'interface',
    renderTypes: false,
    moduleSystem: 'ESM',
  
    
    enumType: "union",
    constraints: {
      enumKey: typeScriptDefaultEnumKeyConstraints({
        NAMING_FORMATTER: FormatHelpers.toPascalCase
      })
    },
    presets: [
      {
  
        interface: {
          property: ({ content }: { content: string }) => {
            
            if (content.startsWith('additionalProperties')) {
              return ''
            }
  
            // // for some awkward decision made by modelina, when a property is called type, modelina prefixes it with reserved.
            // // here we remove the preserved prefix from type property
            return content.replace('reservedType', 'type')
          }
  
        }
      }
    ]
  });

  const models = await generator.generate(asyncAPISpec);
  let fileContent = "";
  for (const model of models) {
    // exporting all models
    fileContent += `export ${model.result}`;
    fileContent += `\r\n`
    fileContent += " "
    fileContent += `\r\n`
  }

  return fileContent;



}



