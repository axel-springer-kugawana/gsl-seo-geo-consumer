import express, { Request, Response } from 'express';
import { lambdasEntrypoints } from './lambda-entrypoints.config';
import dotenv from "dotenv";
import { createLambdaContextObjectFromContextPayload } from './local-lambda-context';

dotenv.config({
  path: `${__dirname}/.local.env`
});

const app = express();
app.use(express.json());
const router = express.Router();

const port = process.env.LOCAL_DEBUG_SERVER || 4242;

const getExportedFunctionsFromModule = async (lambdaEntryPoint: string) => {
  const module = await import(lambdaEntryPoint);
  return Object.keys(module)
}


router.post("/:lambda/:handler/", async (req: Request, res: Response) => {
  const lambdaEntry = lambdasEntrypoints.find(lambdaEntry => {
    return lambdaEntry.lambdaName === req.params.lambda;

  });

  if (!lambdaEntry) {
    return res.status(404).json({
      error: "lambda entrypoint not found. An entrypoint should be the path of the lambda you want to invoke. Please make sure that your entrypoint is defined in `lambda-entrypoints.config.ts` file"
    })
      .end();
  }

  const module = await import(lambdaEntry.entryPoint);
  const lambdaFunctionHandler = module[req.params.handler];

  if (!lambdaFunctionHandler) {
    return res.status(404).json({
      error: "lambda handler not found. Please make sure that your lambda handler function is exported from your lambda entrypoint."
    }).end();
  }


  try {

    const result = await lambdaFunctionHandler(req.body.event, createLambdaContextObjectFromContextPayload(req.body.context));
    return res.status(200).json(result).end();

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "lambda invocation resulted in an exception",
      error
    }).end();
  }

});


app.use("/invoke", router,);


app.listen(port, async () => {
  console.log(`[Local λ debugger]: Local lambda invoke debug server is running at http://localhost:${port}`);
  console.log(`[Local λ debugger]: Discovered ${lambdasEntrypoints.length} lambdas entrypoints`);

  for (let index = 0; index < lambdasEntrypoints.length; index++) {
    const element = lambdasEntrypoints[index];
    console.log(`  [λ entrypoint]: ${element.lambdaName}`);
    const exportedFunctions = await getExportedFunctionsFromModule(element.entryPoint);

    exportedFunctions.forEach((f) => {
      console.log(`    [exported functions]: ${f}`);
    })
  }


  const usage = `Usage: curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"event":"<lambda event payload>","context":"<lambda invocation context payload>"}' \
  http://localhost:${port}/invoke/your-lambda-entrypoint/handler-function-name`

  console.log(usage);

});

