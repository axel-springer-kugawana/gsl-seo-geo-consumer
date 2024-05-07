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


// const pool = getClassifiedApiSecret().then((apisecrets) => {
//   const pool = new Pool({
//     max: 1,
//     min: 0,
//     idleTimeoutMillis: 120000,
//     connectionTimeoutMillis: 10000,
//     host: apisecrets.Host,
//     port: apisecrets.Port,
//     user: apisecrets.Username,
//     password: apisecrets.Password,
//     database: apisecrets.Database
//   });
//   return pool;
// });



export { pool };