/** @format */

import { Pool } from "pg";
import { getClassifiedApiSecret } from "./classified-api-secrets";

class CustomPool {
  private static abc: CustomPool;
  private poolObject: Pool | null = null;
  private constructor() {
    //
  }
  static getInstance(): CustomPool {
    if (!CustomPool.abc) {
      return (CustomPool.abc = new CustomPool());
    }
    return CustomPool.abc;
  }

  getPool = async (): Promise<Pool> => {
    if (!this.poolObject) {
      const apisecrets = await getClassifiedApiSecret();

      this.poolObject = new Pool({
        // min: 0,
        // idleTimeoutMillis: 120000,
        // connectionTimeoutMillis: 10000,
        host: apisecrets.Host,
        port: apisecrets.Port,
        user: apisecrets.Username,
        password: apisecrets.Password,
        database: apisecrets.Database
        // host: "aviv-seeker-whitelabel-seo-ssot-db-two.ca5oh2kzqupc.eu-west-1.rds.amazonaws.com", //apisecrets.Host,
        // port: 5432, // #apisecrets.Port,
        // user: "main_user", //apisecrets.Username,
        // password: "DUw?5H!{K(xodHYw", //apisecrets.Password,
        // database: "ssot", //apisecrets.Database
      });
    }
    return this.poolObject;
  };
}

const poolInstance = CustomPool.getInstance();

export { poolInstance };