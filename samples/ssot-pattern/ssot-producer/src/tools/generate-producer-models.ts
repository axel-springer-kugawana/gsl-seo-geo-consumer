import { compile } from 'json-schema-to-typescript'
import { jsonSchemaToZod } from "json-schema-to-zod";
import { parse, stringify } from 'yaml'
import fs from 'fs';
import path from "path";
import { Eta } from "eta"
import arg from "arg";
import { generateTsTypesFromAsyncAPISpec } from './gen-types-schema-from-asyncapi-spec';

const args = arg({
    '--ssot-model-json-schema-file': String, // --ssot-model-json-schema-file <string>
    '--dest-dir': String, // --dest-dir <string>
    '--ssot-entity-name': String, // --ssot-entity-name <string>

    '-m': '--ssot-model-json-schema-file',
    '-d': '--dest-dir',
    '-n': '--ssot-entity-name'
  });
  
  
  if (!args["--ssot-model-json-schema-file"]) {
    console.log("Missing required argument: --ssot-model-json-schema-file");
    process.exit();
  }

  if (!args["--dest-dir"]) {
    console.log("Missing required argument: --dest-dir");
    process.exit();
  }

  if (!args["--ssot-entity-name"]) {
    console.log("Missing required argument: --ssot-entity-name");
    process.exit();
  }


const generateCreateSSoTEntityCommandZodDefinition = (modelSchema: Record<string, any>, metadataSchema: Record<string, any>) => {
       // create ssot entity
       const {id, ...rest} = modelSchema.properties;

       const createSSotEntityCommand =  {
           ...modelSchema,
           properties: {
               ...rest
           }
       }
   
        const createSSoTEntityCommandZodDefinition = jsonSchemaToZod( {allOf: [createSSotEntityCommand, metadataSchema]}, {
           module: "esm",
       });

       return createSSoTEntityCommandZodDefinition;
}

const generateUpdateSSoTEntityCommandZodDefinition = (modelSchema: Record<string, any>, metadataSchema: Record<string, any>) => {

     const updateSSoTEntityCommandZodDefinition = jsonSchemaToZod(  {allOf: [modelSchema, metadataSchema]}, {
        module: "esm",
    });

    return updateSSoTEntityCommandZodDefinition;
}


const generateDeleteSSotEntityCommandZodDefinition = (modelSchema: Record<string, any>) => {

    
    const {id } = modelSchema.properties;

    const deleteSSotEntityCommand =  {
        ...modelSchema,
        properties: {
            id
        }
    }

    const deleteSSoTEntityCommandZodDefinition = jsonSchemaToZod(  {allOf: [deleteSSotEntityCommand]}, {
       module: "esm",
   });

   return deleteSSoTEntityCommandZodDefinition;
}


(async () => {

    const modelPath = args["--ssot-model-json-schema-file"] as string;
    const destDir = args["--dest-dir"] as string;
    const ssotEntityName = args["--ssot-entity-name"] as string;

     // ensure that the destination folder is created
    await fs.promises.mkdir(destDir, { recursive: true});

    const ssotModelSchema = parse(fs.readFileSync(modelPath, "utf8"));
    const ssotMetadataSchema = parse(fs.readFileSync(`${__dirname}/templates/metadata.yaml`, "utf8"));
    
    const ssotEntitySchema = {
        allOf: [ssotModelSchema, ssotMetadataSchema]
    };


    const ssotEntityType = await compile(ssotEntitySchema, "ssot-entity", {
        additionalProperties: false,
        unknownAny: false,
    })

    fs.writeFileSync(`${destDir}/models.ts`, ssotEntityType);

    // async api contract
    const eta = new Eta({ views: path.join(__dirname, "templates"), autoEscape: false });

    const res = eta.render("./asyncapi", {
        SSoTEntityName: ssotEntityName,
        SSoTName: ssotEntityName,
        SSoTEntityModel: JSON.stringify(ssotEntitySchema),
    });

    fs.writeFileSync(`${destDir}/asyncapi.yaml`, stringify(JSON.parse(res)), "utf-8");

    // commands
    const createCommand =  generateCreateSSoTEntityCommandZodDefinition(ssotModelSchema, ssotMetadataSchema);
    const deleteCommand =  generateDeleteSSotEntityCommandZodDefinition(ssotModelSchema);
    const updateCommand =  generateUpdateSSoTEntityCommandZodDefinition(ssotModelSchema, ssotMetadataSchema);

    fs.writeFileSync(`${destDir}/create-command.ts`, createCommand);
    fs.writeFileSync(`${destDir}/update-command.ts`, updateCommand);
    fs.writeFileSync(`${destDir}/delete-command.ts`, deleteCommand);

    const fileContent = await generateTsTypesFromAsyncAPISpec(JSON.parse(res));
    fs.writeFileSync(`${destDir}/event-models.ts`, fileContent, "utf-8");

})();