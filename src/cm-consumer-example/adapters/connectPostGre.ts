import { Pool } from "pg";
import { getClassifiedApiSecret } from "./classified-api-secrets";

//const apisecrets = await getClassifiedApiSecret();

// export const pool = async () => {

// const pool = new Pool({
//   // min: 0,
//   // idleTimeoutMillis: 120000,
//   // connectionTimeoutMillis: 10000,

//   host: 'aviv-seeker-whitelabel-seo-ssot-db-two.ca5oh2kzqupc.eu-west-1.rds.amazonaws.com',//apisecrets.Host,
//   port: 5432,// #apisecrets.Port,
//   user: 'main_user',//apisecrets.Username,
//   password: 'DUw?5H!{K(xodHYw',//apisecrets.Password,
//   database: 'ssot'//apisecrets.Database
// });




const pool = async (): Promise<Pool> => {
  //  const apiUrl = config.get("cmApiUrl");
  const apisecrets = await getClassifiedApiSecret();

  // const headers = {
  //   "ClientId": apisecrets.ClientId,
  //   "Authorization": apisecrets.Authorization,
  //   "User-Agent": 'wl-seo/1.0.0',
  // }

  // const res = await fetch(`${apiUrl}${link}`, {
  //   headers
  // });

  // const classified = await res.json() as Classified;


  // return classified;

  return new Pool({
    // min: 0,
    // idleTimeoutMillis: 120000,
    // connectionTimeoutMillis: 10000,

    host: 'aviv-seeker-whitelabel-seo-ssot-db-two.ca5oh2kzqupc.eu-west-1.rds.amazonaws.com',//apisecrets.Host,
    port: 5432,// #apisecrets.Port,
    user: 'main_user',//apisecrets.Username,
    password: 'DUw?5H!{K(xodHYw',//apisecrets.Password,
    database: 'ssot'//apisecrets.Database
  });


}




// const getClassifiedById = async (link: string): Promise<Classified> => {
//   const apiUrl = config.get("cmApiUrl");
//   const apisecrets = await getClassifiedApiSecret();

//   const headers = {
//       "ClientId": apisecrets.ClientId,
//       "Authorization": apisecrets.Authorization,
//       "User-Agent": 'wl-seo/1.0.0',
//   }

//   const res = await fetch(`${apiUrl}${link}`, {
//       headers
//   });

//   const classified = await res.json() as Classified;


//   return classified;

// }


// const apisecrets = await getClassifiedApiSecret();
// const pool = new Pool({
//   // min: 0,
//   // idleTimeoutMillis: 120000,
//   // connectionTimeoutMillis: 10000,

//   host: 'aviv-seeker-whitelabel-seo-ssot-db-two.ca5oh2kzqupc.eu-west-1.rds.amazonaws.com',//apisecrets.Host,
//   port: 5432,// #apisecrets.Port,
//   user: 'main_user',//apisecrets.Username,
//   password: 'DUw?5H!{K(xodHYw',//apisecrets.Password,
//   database: 'ssot'//apisecrets.Database
// });


// // const pool = getClassifiedApiSecret().then((apisecrets) => {
// //   const pool = new Pool({
// //     max: 1,
// //     min: 0,
// //     idleTimeoutMillis: 120000,
// //     connectionTimeoutMillis: 10000,
// //     host: apisecrets.Host,
// //     port: apisecrets.Port,
// //     user: apisecrets.Username,
// //     password: apisecrets.Password,
// //     database: apisecrets.Database
// //   });
// //   return pool;
// // });



export { pool };