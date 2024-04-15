import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";
import { randomInt } from "crypto";
import { Connection } from 'postgresql-client';
import { DataTypeOIDs } from 'postgresql-client';

const createOrUpdateClassifiedPostGre = async (id: string, data: Classified): Promise<void> => {
  //	docker run -itd -e POSTGRES_USER=user -e POSTGRES_PASSWORD=user -p 5432:5432 -v /data:/var/lib/postgresql/data --name postgresql postgres
  try {
    const connection = new Connection({
      host: 'localhost',
      port: 5432,
      user: 'user',
      password: 'user',
      database: 'user',
      timezone: 'Europe/Amsterdam'
    });
    const query = `
    INSERT INTO Classified (
        ClassifiedId, 
        Brand, 
        Portals, 
        EstateType, 
        EstateSubType, 
        DistributionType, 
        AvivGeoId, 
        Country, 
        PostalCode,
        Price,
        NumberOfRooms,
        FeaturesIncluded,
        Furnished,
        YearOfConstruction,
        CertificateOfEligibilityNeeded,
        LocationInBuilding
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `;

    await connection.connect();
    const statement = await connection.prepare(
      query, {
      paramTypes:
        [
          DataTypeOIDs.int4,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar,
          DataTypeOIDs.varchar
        ]
    });
    var result = await statement.execute(
      {
        params: [
          randomInt(45514),
          data.metadata.brand,
          data.visibility.requests.map(item => item.portal),
          data.data.estateType,
          data.data.estateSubType,
          data.data.distributionType,
          data.data.location.avivGeoId,
          data.data.location.country,
          data.data.location.postalcode,
          data.data.prices.buy,
          data.data.structure.rooms.numberOfRooms,
          data.data.features,
          data.data.features.furnished,
          data.data?.conditions?.yearOfConstruction,
          data.data?.management?.rent?.certificateOfEligibilityNeeded,
          data.data.structure.building.locationInBuilding
        ]
      });
    await connection.close();
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
  createOrUpdateClassifiedPostGre
}