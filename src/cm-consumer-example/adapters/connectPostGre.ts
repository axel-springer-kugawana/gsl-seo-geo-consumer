import { Pool } from "pg";
import { getClassifiedApiSecret } from "./classified-api-secrets";


// const apisecrets = await getClassifiedApiSecret();
const pool = new Pool({
  max: 1,
  min: 0,
  idleTimeoutMillis: 120000,
  connectionTimeoutMillis: 10000,
  host: 'aviv-seeker-whitelabel-seo-ssot-db.cluster-ca5oh2kzqupc.eu-west-1.rds.amazonaws.com',//apisecrets.Host,
  port: 5432,// #apisecrets.Port,
  user: 'main_user',//apisecrets.Username,
  password: 'DUw?5H!{K(xodHYw',//apisecrets.Password,
  database: 'ssot'//apisecrets.Database
});

// // connection details inherited from environment
// const pool = new Pool({
//   max: 1,
//   min: 0,
//   idleTimeoutMillis: 120000,
//   connectionTimeoutMillis: 10000
// });



export { pool };