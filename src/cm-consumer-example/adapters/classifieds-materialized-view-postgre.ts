import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";
import { Client } from 'pg';
import { mapFeatures, mapPrice } from '../utils/mappingHelpers';
import { getClassifiedApiSecret } from "./classified-api-secrets";
import { EstateType } from "@shared/models/classified/1.0.0/estate-type";

const markClassifiedAsDeleted = async (deleteCommand: { classifiedId: string, updateDate: string }): Promise<void> => {

  const { classifiedId, updateDate } = deleteCommand;
  try {
    const values = [classifiedId];

    const apisecrets = await getClassifiedApiSecret();
    const client = new Client({
      host: apisecrets.Host,
      port: apisecrets.Port,
      user: apisecrets.Username,
      password: apisecrets.Password,
      database: apisecrets.Database,
      connectionTimeoutMillis: 3000
    });

    await client.connect()

    const query = `
    DELETE FROM Classified 
    WHERE ClassifiedId=$1`;

    const res = await client.query(query, values);

    await client.end();
  }
  catch (e) {

    if (e.name === "ConditionalCheckFailedException") {
      logger.error("Conditional Check failed on lastUpdate date. Classified won't be deleted", {
        classified: classifiedId
      })
    } else {
      logger.error(e);
    }
  }
}

const createOrUpdateClassified = async (id: string, data: Classified): Promise<void> => {

  try {
    const price = mapPrice(data) ?? undefined;

    const features = mapFeatures(data);
    const {
      apartment,
      agricultureForestry,
      gastronomyHotel,
      house,
      office,
      parking,
      plot,
      project,
      senior,
      storageProduction,
      trading
    } = { ...data.data.estateSubType }
    apartment

    //Mapping : https://avivgroup.atlassian.net/browse/WLSEO-501
    const values = [
      id,
      price,
      data.data.location.avivGeoId,//c=>i geoId
      data.data.distributionType,//j DistributionType
      data.data.estateType,//k EstateType
      apartment ?? agricultureForestry ?? gastronomyHotel ?? house ?? office ?? parking ?? plot ?? project ?? senior ?? storageProduction ?? trading,
      data.data?.structure?.rooms?.numberOfRooms,   // m NumberOfRooms
      data.data?.features?.furnished,  // n Furnished
      data.data?.conditions?.yearOfConstruction,// o YearOfConstruction
      data.data?.management?.rent?.certificateOfEligibilityNeeded,  // p CertificateOfEligibilityNeeded
      data.data?.structure?.building?.locationInBuilding,  // q LocationInBuilding
      features,
      data.data.location.country,
      data.metadata.brand,
      data.visibility.requests.map(e => e.portal),
      data.data.location.postalcode
    ];
    const apisecrets = await getClassifiedApiSecret();
    const client = new Client({
      host: apisecrets.Host,
      port: apisecrets.Port,
      user: apisecrets.Username,
      password: apisecrets.Password,
      database: apisecrets.Database,
      connectionTimeoutMillis: 3000
    });

    await client.connect()

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
      FeaturesIncluded,
      Country,
      Brand,
      Portals,
      Postalcode
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
ON CONFLICT (ClassifiedId) DO UPDATE 
      SET Price = $2,
          AvivGeoId= $3, 
          DistributionType= $4, 
          EstateType= $5, 
          EstateSubType= $6, 
          NumberOfRooms= $7,
          Furnished= $8,
          YearOfConstruction= $9,
          CertificateOfEligibilityNeeded= $10,
          LocationInBuilding= $11,
          FeaturesIncluded= $12,
          Country = $13,
          Brand = $14,
          Portals = $15,
          Postalcode = $16
          ;`;

    const res = await client.query(query, values);

    await client.end();
  }
  catch (e) {

    if (e.name === "ConditionalCheckFailedException") {
      logger.error("Conditional Check failed on lastUpdate date. Classified won't be updated", {
        classified: data
      })
    } else {
      logger.error(e);
    }

  }
}

export {
  createOrUpdateClassified,
  markClassifiedAsDeleted
}