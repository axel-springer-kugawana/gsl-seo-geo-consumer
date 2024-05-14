/** @format */

import { Pool } from "pg";
import { getClassifiedApiSecret } from "./classified-api-secrets";

//const apisecrets = await getClassifiedApiSecret();

// export const pool = async () => {
const pool = async (): Promise<Pool> => {
  const apisecrets = await getClassifiedApiSecret();
  
  return new Pool({
    // min: 0,
    // idleTimeoutMillis: 120000,
    // connectionTimeoutMillis: 10000,

    host: "aviv-seeker-whitelabel-seo-ssot-db-two.ca5oh2kzqupc.eu-west-1.rds.amazonaws.com", //apisecrets.Host,
    port: 5432, // #apisecrets.Port,
    user: "main_user", //apisecrets.Username,
    password: "DUw?5H!{K(xodHYw", //apisecrets.Password,
    database: "ssot", //apisecrets.Database
  });
};

export { pool };
