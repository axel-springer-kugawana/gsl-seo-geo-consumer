import { logger } from "@shared/cross-cutting/logger";
import { Classified } from "@shared/models/classified/1.0.0/classified";
import { randomInt } from "crypto";
import { Client } from 'pg';
import {DistributionType, Portal } from '../models/classifiedEnums';


export const mapPrice = (
  data: Classified
): number | null => {

  const portals = data.visibility.requests;
  const distributionType = data.data.distributionType;
  const prices = data.data.prices;

  const { rent, buy, buyAuction, compulsoryAuction } = prices || {}
  const isDE = [Portal.IMMONET, Portal.IWT].some((portal) => portals?.map((p) => p.portal).includes(portal))
  const priceMapping = {
    [DistributionType.RENT]: getRentPrice(rent, isDE),
    [DistributionType.BUY]: buy?.price ?? buy?.pricePerSqUnit,
    [DistributionType.BUY_AUCTION]: getBuyAuctionPrice(buyAuction, buy),
    [DistributionType.COMPULSORY_AUCTION]: getCompulsoryAuctionPrice(compulsoryAuction, buyAuction, buy),
  }
  return priceMapping[distributionType]?.amount
}

const getRentPrice = (
  rent: Classified['data']['prices']['rent'],
  isDE: boolean,
): { amount?: number } => {
  const hierarchyRentDEMapping = ['baseRent', 'totalRent', 'pricePerSqUnit']
  const hierarchyRentMapping = ['totalRent', 'baseRent', 'pricePerSqUnit']
  const selectedKey = isDE ? hierarchyRentDEMapping : hierarchyRentMapping
  return rent?.[`${selectedKey[0]}`] ?? rent?.[`${selectedKey[1]}`] ?? rent?.[`${selectedKey[2]}`]
}
const getBuyAuctionPrice = (
  buyAuction: Classified['data']['prices']['buyAuction'],
  buy: Classified['data']['prices']['buy'],
): { amount?: number } => buyAuction?.minPrice ?? buy?.price ?? buy?.pricePerSqUnit
const getCompulsoryAuctionPrice = (
  compulsoryAuction: Classified['data']['prices']['compulsoryAuction'],
  buyAuction: Classified['data']['prices']['buyAuction'],
  buy: Classified['data']['prices']['buy'],
): { amount?: number } => compulsoryAuction?.minimumBid ?? getBuyAuctionPrice(buyAuction, buy)


const createOrUpdateClassified = async (id: string, data: Classified): Promise<void> => {
  //	docker run -itd -e POSTGRES_USER=user -e POSTGRES_PASSWORD=user -p 5432:5432 -v /data:/var/lib/postgresql/data --name postgresql postgres

  const price = mapPrice(data) ?? undefined;

  try {

    // const client = new Client();
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'user',
      password: 'user',
      database: 'user',
    });

    await client.connect()

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
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`;
    const values = [
      randomInt(45514),
      data.metadata.brand,
      data.visibility.requests,
      data.data.estateType,
      data.data.estateSubType,
      data.data.distributionType,
      data.data.location.avivGeoId,
      data.data.location.country,
      data.data.location.postalcode,
      price,
      data.data.structure.rooms.numberOfRooms,
      data.data.features,
      data.data.features.furnished,
      data.data?.conditions?.yearOfConstruction,
      data.data?.management?.rent?.certificateOfEligibilityNeeded,
      data.data.structure.building.locationInBuilding
    ];

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