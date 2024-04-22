import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";
import { randomInt } from "crypto";
import { Client } from 'pg';

import { Telnet } from 'telnet-client';
import { mapFeatures, mapPrice } from '../utils/mappingHelpers';
import { getClassifiedApiSecret } from "./classified-api-secrets";


const createOrUpdateClassified = async (id: string, data: Classified): Promise<void> => {
  //	docker run -itd -e POSTGRES_USER=user -e POSTGRES_PASSWORD=user -p 5432:5432 -v /data:/var/lib/postgresql/data --name postgresql postgres

  try {
    const price = mapPrice(data) ?? undefined;

    const features = mapFeatures(data);

    //Mapping : https://avivgroup.atlassian.net/browse/WLSEO-501
    const values = [
      randomInt(45514),//a. Classified ID (primary key) A
      price,//  b. Price
      data.data.location.avivGeoId,//c=>i geoId
      data.data.distributionType,//j DistributionType
      data.data.estateType,//k EstateType
      data.data.estateSubType,//l EstateSubType


      data.data?.structure?.rooms?.numberOfRooms,   // m NumberOfRooms
      data.data?.features?.furnished,  // n Furnished

      data.data?.conditions?.yearOfConstruction,// o YearOfConstruction
      data.data?.management?.rent?.certificateOfEligibilityNeeded,  // p CertificateOfEligibilityNeeded
      data.data?.structure?.building?.locationInBuilding,  // q LocationInBuilding

      // r Balcony_Terrace
      // s Cellar
      // t Commission_Free
      // u Garden
      // v Kitchen_Fully_Equipped
      // w Parking_Garage
      // x Reduce_Mobility_Access
      features

      // data.metadata.brand,
      // data.visibility.requests,
      // data.data.location.country,
      // data.data.location.postalcode,

    ];
    const apisecrets = await getClassifiedApiSecret();



    async function testConnection() {
      const params = {
        host: apisecrets.Host,
        port: 5432 // Le port par défaut pour PostgreSQL
      };
      const connection = new Telnet();
      try {
        await connection.connect(params);
        console.log('Connexion réussie !');
      } catch (error) {
        console.error('Erreur lors de la connexion :', error);
      } finally {
        connection.end();
      }
    }
    testConnection();

    // const server = new Telnet();

    // // display server response
    // server.on("data", function (data) {
    //   console.log('' + data);
    // });

    // // login when connected
    // server.on("connect", function () {
    //   server.write("login <user> <pass>\r\n");
    // });
    // ///logger.warn(" connect to server");
    // // connect to server
    // server.connect({
    //   host: apisecrets.Host,
    //   port: apisecrets.Port
    // });
    // logger.warn("telnet connected");

    const client = new Client({
      host: apisecrets.Host,
      port: apisecrets.Port,
      user: apisecrets.Username,
      password: apisecrets.Password,
      database: apisecrets.Database,
      //ssl: true,
      connectionTimeoutMillis: 3000
    });


    // const client = new Client({
    //   host: "aviv-seeker-whitelabel-seo-ssot-db.cluster-ca5oh2kzqupc.eu-west-1.rds.amazonaws.com",//apisecrets.Host,
    //   port: 5432,//apisecrets.Port,
    //   user: "main_user",//apisecrets.Username,
    //   password: "ag.Nng{9}h8?}_z<E+G(IS*E)_dO",//apisecrets.Password,
    //   database: "ssot",//apisecrets.Database

    //   connectionTimeoutMillis: 3000
    // });

    // logger.warn(" try connect post gre client");
    await client.connect()

    logger.warn("connected to postgre client");
    const query = `
    INSERT INTO Classified (
        ClassifiedId, 
        Price,
        AvivGeoId, 
        DistributionType, 
        EstateType, 
        EstateSubType, 
        NumberOfRooms,
        Furnished,
        YearOfConstruction,
        CertificateOfEligibilityNeeded,
        LocationInBuilding,
        FeaturesIncluded
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;

    logger.warn("step8");
    const res = await client.query(query, values);
    logger.warn("step9");
    await client.end();
  }
  catch (e) {

    if (e.name === "ConditionalCheckFailedException") {
      logger.warn("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: data
      })
    } else {
      logger.warn(e);

    }

  }
}

export {
  createOrUpdateClassified
}