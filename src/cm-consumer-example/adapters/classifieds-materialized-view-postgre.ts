import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";
import { randomInt } from "crypto";
import { Client } from 'pg';
import { mapFeatures, mapPrice } from '../utils/mappingHelpers';


const createOrUpdateClassified = async (id: string, data: Classified): Promise<void> => {
  //	docker run -itd -e POSTGRES_USER=user -e POSTGRES_PASSWORD=user -p 5432:5432 -v /data:/var/lib/postgresql/data --name postgresql postgres

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


    data.data.structure.rooms.numberOfRooms,   // m NumberOfRooms
    data.data.features.furnished,  // n Furnished

    data.data?.conditions?.yearOfConstruction,// o YearOfConstruction
    data.data?.management?.rent?.certificateOfEligibilityNeeded,  // p CertificateOfEligibilityNeeded
    data.data.structure.building.locationInBuilding,  // q LocationInBuilding

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

  try {

    // const client = new Client();
    const client = new Client({
      host: 'aviv-seeker-whitelabel-seo-ssot-db.cluster-ca5oh2kzqupc.eu-west-1.rds.amazonaws.com',
      port: 5432,
      user: 'main_user',
      password: 'ag.Nng{9}h8?}_z<E+G(IS*E)_dO',
      database: 'ssot',
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
        FeaturesIncluded
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`;


    const res = await client.query(query, values);

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