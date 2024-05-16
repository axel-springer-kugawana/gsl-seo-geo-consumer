import { z } from 'zod'
import {
  BuildState,
  DistributionType,
  ExtendedValidation,
  KitchenEquipment,
  MarketStatus,
  Portal,
  UseFor,
  Validation,
} from '@/models'

export const classifiedManagementStructure = z.object({
  classifiedId: z.string(),
  metadata: z.object({
    creationDate: z.string().datetime(),
    updateDate: z.optional(z.string().datetime()),
    projectId: z.optional(z.string()),
    externalProjectId: z.optional(z.string()),
    classifiedBusiness: z.optional(z.string()),
  }),
  visibility: z.optional(
    z.object({
      requests: z.array(
        z.object({
          portal: z.nativeEnum(Portal),
        }),
      ),
      validations: z.optional(
        z.array(
          z.object({
            portal: z.nativeEnum(Portal),
          }),
        ),
      ),
    }),
  ),
  media: z.optional(
    z.array(
      z.object({
        avivMediaId: z.optional(z.string()),
      }),
    ),
  ),
  data: z.object({
    distributionType: z.nativeEnum(DistributionType),
    estateType: z.string(),
    estateSubType: z.optional(z.record(z.string(), z.string())),
    spaces: z.optional(
      z.object({
        usableFloorSpace: z.optional(z.number()),
        overallSpace: z.optional(z.number()),
        plotSpace: z.optional(z.number()),
        residential: z.optional(
          z.object({
            livingSpace: z.optional(z.number()),
          }),
        ),
        commercial: z.optional(
          z.object({
            commercialSpace: z.optional(z.number()),
            shopSpace: z.optional(z.number()),
            storageSpace: z.optional(z.number()),
            sellSpace: z.optional(z.number()),
            officeSpace: z.optional(z.number()),
            officePartSpace: z.optional(z.number()),
            managementSpace: z.optional(z.number()),
            restaurantSpace: z.optional(z.number()),
          }),
        ),
      }),
    ),
    prices: z.optional(
      z.object({
        buy: z.optional(
          z.object({
            price: z.optional(
              z.object({
                amount: z.number(),
              }),
            ),
            pricePerSqUnit: z.optional(
              z.object({
                amount: z.number(),
              }),
            ),
          }),
        ),
        rent: z.optional(
          z.object({
            baseRent: z.optional(
              z.object({
                amount: z.number(),
              }),
            ),
            totalRent: z.optional(
              z.object({
                amount: z.number(),
              }),
            ),
            pricePerSqUnit: z.optional(
              z.object({
                amount: z.number(),
              }),
            ),
          }),
        ),
        compulsoryAuction: z.optional(
          z.object({
            minimumBid: z.optional(
              z.object({
                amount: z.number(),
              }),
            ),
          }),
        ),
        buyAuction: z.optional(
          z.object({
            minPrice: z.optional(
              z.object({
                amount: z.number(),
              }),
            ),
          }),
        ),
        brokerageFee: z.optional(
          z.object({
            hasFee: z.optional(z.nativeEnum(Validation)),
          }),
        ),
      }),
    ),
    conditions: z.optional(
      z.object({
        yearOfConstruction: z.optional(z.number()),
        buildState: z.optional(z.nativeEnum(BuildState)),
      }),
    ),
    structure: z.optional(
      z.object({
        building: z.optional(
          z.object({
            locationInBuilding: z.optional(z.string()),
            numberOfFloors: z.optional(z.number()),
            barrierFree: z.optional(z.nativeEnum(Validation)),
            bath: z.optional(
              z.object({
                window: z.optional(z.nativeEnum(Validation)),
                bathtub: z.optional(z.nativeEnum(Validation)),
              }),
            ),
            kitchen: z.optional(
              z.object({
                kitchenEquipment: z.optional(z.nativeEnum(KitchenEquipment)),
                kitchenType: z.optional(
                  z.object({
                    builtIn: z.optional(z.boolean()),
                  }),
                ),
              }),
            ),
            cellar: z.optional(z.nativeEnum(Validation)),
            elevator: z.optional(
              z.object({
                person: z.optional(z.nativeEnum(Validation)),
                freight: z.optional(z.nativeEnum(Validation)),
              }),
            ),
          }),
        ),
        parkingLots: z.optional(
          z.object({
            outside: z.optional(z.number()),
            streetParking: z.optional(z.number()),
            carport: z.optional(z.number()),
            garage: z.optional(z.number()),
            doubleGarage: z.optional(z.number()),
            duplex: z.optional(z.number()),
            garageArea: z.optional(z.number()),
            parkingArea: z.optional(z.number()),
            carPark: z.optional(z.number()),
            underground: z.optional(z.number()),
          }),
        ),
        rooms: z.optional(
          z.object({
            numberOfRooms: z.optional(z.number()),
            numberOfBalconies: z.optional(z.number()),
            numberOfTerraces: z.optional(z.number()),
          }),
        ),
      }),
    ),
    management: z.optional(
      z.object({
        isImmediatelyAvailable: z.optional(z.boolean()),
        isRented: z.optional(z.boolean()),
        rent: z.optional(
          z.object({
            petsAllowed: z.optional(z.nativeEnum(Validation)),
            certificateOfEligibilityNeeded: z.optional(z.nativeEnum(Validation)),
            isShortTimeRental: z.optional(z.boolean()),
          }),
        ),
        useFor: z.optional(z.nativeEnum(UseFor)),
        isForInvestment: z.optional(z.boolean()),
        marketStatus: z.optional(z.nativeEnum(MarketStatus)),
      }),
    ),
    features: z.optional(
      z.object({
        garden: z.optional(
          z.object({
            part: z.optional(z.boolean()),
            private: z.optional(z.boolean()),
            shared: z.optional(z.boolean()),
          }),
        ),
        wheelchairUse: z.optional(z.nativeEnum(Validation)),
        furnished: z.optional(z.nativeEnum(ExtendedValidation)),
        residential: z.optional(
          z.object({
            flatSharePossible: z.optional(z.nativeEnum(Validation)),
          }),
        ),
      }),
    ),
    location: z.object({
      country: z.string().nullish(),
      postalcode: z.string().nullish(),
      city: z.string().nullish(),
      geometry: z.optional(
        z.object({
          // min(2).max(3) because in theory, a third entry could contain the elevation of the point
          coordinates: z.optional(z.number().array().min(2).max(3)),
          type: z.optional(z.literal('Point')),
        }),
      ),
      avivGeoId: z.string().nullish(),
      street: z.string().nullish(),
      houseNumber: z.string().nullish(),
      floorNumber: z.number().nullish(),
    }),
    energy: z.optional(
      z.object({
        countrySpecific: z.optional(
          z.object({
            de: z.optional(
              z.object({
                energyCertificates: z.optional(
                  z.array(
                    z.object({
                      efficiencyClass: z.optional(z.string()),
                    }),
                  ),
                ),
              }),
            ),
            fr: z.optional(
              z.object({
                energyCertificate: z.optional(
                  z.object({
                    efficiencyClass: z.optional(z.string()),
                  }),
                ),
              }),
            ),
            at: z.optional(
              z.object({
                energyCertificates: z.optional(
                  z.array(
                    z.object({
                      overallEnergyEfficiencyFactorClass: z.optional(z.string()),
                    }),
                  ),
                ),
              }),
            ),
          }),
        ),
      }),
    ),
  }),
  specifics: z.optional(
    z.object({
      de: z.optional(
        z.object({
          iwtStellplatzAnzahl: z.optional(z.number()),
        }),
      ),
    }),
  ),
})

export type ClassifiedManagementStructure = z.infer<typeof classifiedManagementStructure>
export type ClassifiedManagementLocationStructure = ClassifiedManagementStructure['data']['location']

export const getClassifiedRevision = ({ metadata: { creationDate, updateDate } }: ClassifiedManagementStructure) => {
  const date = new Date(updateDate || creationDate)
  return date.getTime()
}