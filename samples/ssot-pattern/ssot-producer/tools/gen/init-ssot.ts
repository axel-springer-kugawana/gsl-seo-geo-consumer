import { compile } from 'json-schema-to-typescript'
import { jsonSchemaToZod } from "json-schema-to-zod";
import { parse, stringify } from 'yaml'
import fs from 'fs';
import path from "path";
import { Eta } from "eta"
import arg from "arg";
import { generateTsTypesFromAsyncAPISpec } from './gen-types-schema-from-asyncapi-spec';

const destDirs = {
    src :  {
        models: `${__dirname}/../../src/shared/models/ssot-entity`
    },
    apidocs: {
        asyncapi:  `${__dirname}/../../api-docs`
    },
    infra: {
        apptfvars: `${__dirname}/../../infra`
    }
} 

const args = arg({
    '--ssot-model-json-schema-file': String, // --ssot-model-json-schema-file <string>
    '--ssot-entity-name': String, // --ssot-entity-name <string>
    '--ssot-name': String, // --ssot-name <string>

    '-m': '--ssot-model-json-schema-file',
    '-n': '--ssot-entity-name',
    '-s': '--ssot-name'
  });
  
  
  if (!args["--ssot-model-json-schema-file"]) {
    console.log("Missing required argument: --ssot-model-json-schema-file");
    process.exit();
  }


  if (!args["--ssot-entity-name"]) {
    console.log("Missing required argument: --ssot-entity-name");
    process.exit();
  }

  if (!args["--ssot-name"]) {
    console.log("Missing required argument: --ssot-name");
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

const generateAsyncAPIDocsAndEventModels = async (eta: Eta, ssotEntityName: string, ssotName: string, ssotEntitySchema: any) => {
  
    const res = eta.render("./asyncapi", {
        SSoTEntityName: ssotEntityName,
        SSoTName: ssotName,
        SSoTEntityModel: JSON.stringify(ssotEntitySchema),
    });

    fs.writeFileSync(path.join(destDirs.apidocs.asyncapi, "asyncapi.yaml"), stringify(JSON.parse(res)), "utf-8");

    const fileContent = await generateTsTypesFromAsyncAPISpec(JSON.parse(res));
    fs.writeFileSync(path.join(destDirs.src.models, "event-models.ts"), fileContent, "utf-8");

}

const generateTerraformVars = (eta: Eta, ssotName: string) => {
    const infraAppVars = eta.render("./appvars", {
        SSoTName: ssotName.toLowerCase(),
    });

    fs.writeFileSync(path.join(destDirs.infra.apptfvars, "appvars.tf"), infraAppVars, "utf-8");
}

const generateSSotInternalCommandModels = (ssotModelSchema: any, ssotMetadataSchema: any) => {
    const createCommand = generateCreateSSoTEntityCommandZodDefinition(ssotModelSchema, ssotMetadataSchema);
    const deleteCommand = generateDeleteSSotEntityCommandZodDefinition(ssotModelSchema);
    const updateCommand = generateUpdateSSoTEntityCommandZodDefinition(ssotModelSchema, ssotMetadataSchema);

    fs.writeFileSync(path.join(destDirs.src.models, "create-command.ts"), createCommand);
    fs.writeFileSync(path.join(destDirs.src.models, "update-command.ts"), updateCommand);
    fs.writeFileSync(path.join(destDirs.src.models, "delete-command.ts"), deleteCommand);
}

const generateSSotSharedModels = async (ssotModelSchema: any, ssotMetadataSchema: any) => {
    const ssotEntitySchema = {
        allOf: [ssotModelSchema, ssotMetadataSchema]
    };

    const ssotEntityType = await compile(ssotEntitySchema, "ssot-entity", {
        additionalProperties: false,
        unknownAny: false,
    });

    fs.writeFileSync(path.join(destDirs.src.models, "models.ts"), ssotEntityType);
    return ssotEntitySchema;
}




(async () => {

    const modelPath = args["--ssot-model-json-schema-file"] as string;
    const ssotName = args["--ssot-name"] as string;
    const ssotEntityName = args["--ssot-entity-name"] as string;

     // ensure that the destination folder is created
    await fs.promises.mkdir(destDirs.src.models, { recursive: true});

    const ssotModelSchema = parse(fs.readFileSync(modelPath, "utf8"));
    const ssotMetadataSchema = parse(fs.readFileSync(`${__dirname}/templates/metadata.yaml`, "utf8"));
    
    const ssotEntitySchema = await generateSSotSharedModels(ssotModelSchema, ssotMetadataSchema);
    generateSSotInternalCommandModels(ssotModelSchema, ssotMetadataSchema);


    const eta = new Eta({ views: path.join(__dirname, "templates"), autoEscape: false });
    await generateAsyncAPIDocsAndEventModels(eta, ssotEntityName, ssotName, ssotEntitySchema);
    generateTerraformVars(eta, ssotName);

  
})();



