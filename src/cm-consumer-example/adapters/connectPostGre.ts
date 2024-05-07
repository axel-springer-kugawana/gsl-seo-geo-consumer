import { Pool } from "pg";
import { getClassifiedApiSecret } from "./classified-api-secrets";


const pool = getClassifiedApiSecret().then((apisecrets) => {
  const pool = new Pool({
    max: 1,
    min: 0,
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 10000,
    host: apisecrets.Host,
    port: apisecrets.Port,
    user: apisecrets.Username,
    password: apisecrets.Password,
    database: apisecrets.Database
  });
  return pool;
});

export { pool };