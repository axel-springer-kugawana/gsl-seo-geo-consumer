/** @format */

import { Pool } from "pg";
import { getClassifiedApiSecret } from "./classified-api-secrets";

class CustomPool {
  private static instance: CustomPool;
  private poolObject: Pool | null = null;
  private constructor() {
  }
  static getInstance(): CustomPool {
    if (!CustomPool.instance) {
      return (CustomPool.instance = new CustomPool());
    }
    return CustomPool.instance;
  }

  getPool = async (): Promise<Pool> => {
    if (!this.poolObject) {
      const apisecrets = await getClassifiedApiSecret();

      this.poolObject = new Pool({
        min: 0,
        max: 1,
        host: apisecrets.HostWriter,
        port: apisecrets.Port,
        user: apisecrets.Username,
        password: apisecrets.Password,
        database: apisecrets.Database
      });
    }
    return this.poolObject;
  };
}

const poolInstance = CustomPool.getInstance();

export { poolInstance };