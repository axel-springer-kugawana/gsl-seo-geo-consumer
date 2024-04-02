import { globSync } from 'glob';
import path from 'path';

export const lambdasEntrypoints = globSync('./**/lambda-handlers/*.ts', {
  ignore: ['node_modules/**']
})
  .filter((f) => f.indexOf('.test.ts') < 0)
  .map((entry) => {
    return {
      entryPoint: entry.split(path.sep).join(path.posix.sep),
      lambdaName: entry.split(path.sep).slice(-1)[0].replace('.ts', '')
    };
  });
