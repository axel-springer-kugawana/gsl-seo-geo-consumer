/** @format */

import { Pool } from "pg";
import { getClassifiedApiSecret } from "./classified-api-secrets";

class CustomPool {
  private static instance: CustomPool;
  private poolObject: Pool | null = null;
  private constructor() {
    //
  }
  static getInstance(): CustomPool {
    if (!CustomPool.instance) {
      return (CustomPool.instance = new CustomPool());
    }
    return CustomPool.instance;
  }

  getPool = async (): Promise<Pool> => {
    if (!this.poolObject) {
      this.poolObject = new Pool({
        // min: 0,
        // idleTimeoutMillis: 120000,
        // connectionTimeoutMillis: 10000,

        host: "aviv-seeker-whitelabel-seo-ssot-db-two.ca5oh2kzqupc.eu-west-1.rds.amazonaws.com", //apisecrets.Host,
        port: 5432, // #apisecrets.Port,
        user: "main_user", //apisecrets.Username,
        password: "DUw?5H!{K(xodHYw", //apisecrets.Password,
        database: "ssot", //apisecrets.Database
      });
    }
    return this.poolObject;
  };
}

const poolInstance = CustomPool.getInstance();

export { poolInstance };