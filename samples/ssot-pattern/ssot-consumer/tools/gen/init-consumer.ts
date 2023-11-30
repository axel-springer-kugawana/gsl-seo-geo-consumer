import fs from 'fs';
import path from "path";
import { Eta } from "eta"
import arg from "arg";

const destDirs = {
    src :  {
        models: `${__dirname}/../../src/shared/models`
    },
    infra: {
        apptfvars: `${__dirname}/../../infra`
    }
} 

const args = arg({
    '--consumer-name': String, // --consumer-name <string>
    '--ssot-entity-name': String, // --ssot-entity-name <string>
    '--ssot-name': String, // --ssot-name <string>

    '-n': '--ssot-entity-name',
    '-c': '--consumer-name',
    '-s': '--ssot-name'
  });


  if (!args["--consumer-name"]) {
    console.log("Missing required argument: --consumer-name");
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



const generateTerraformVars = (eta: Eta, ssotConsumerName: string) => {
    const infraAppVars = eta.render("./appvars", {
        SSoTConsumerName: ssotConsumerName.toLowerCase(),
    });

    fs.writeFileSync(path.join(destDirs.infra.apptfvars, "appvars.tf"), infraAppVars, "utf-8");
}

const generateSSotConsumerSharedModels = async (eta: Eta, ssotConsumerName: string, ssotEntityName: string) => {
    const ssotConsumerConstants = eta.render("./ssot-consumer-constants", {
        SSoTConsumerName: ssotConsumerName.toLowerCase(),
        SSoTEntityName: ssotEntityName.toLowerCase()
    });

    fs.writeFileSync(path.join(destDirs.src.models, "ssot-consumer-constants.ts"), ssotConsumerConstants, "utf-8");
}

(async () => {

    const ssotEntityName = args["--ssot-entity-name"] as string;
    const ssotConsumerName = args["--consumer-name"] as string;

     // ensure that the destination folder is created
    await fs.promises.mkdir(destDirs.src.models, { recursive: true});
    const eta = new Eta({ views: path.join(__dirname, "templates"), autoEscape: false });

    generateSSotConsumerSharedModels(eta, ssotConsumerName, ssotEntityName);
    generateTerraformVars(eta, ssotConsumerName);
  
})();



