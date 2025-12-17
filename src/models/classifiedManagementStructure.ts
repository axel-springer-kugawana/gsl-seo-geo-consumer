import { z } from 'zod'

// import { MandatoryMessageData } from './baseMessage'

// eslint-disable-next-line no-confusing-arrow
const convertToISOString = (date: string | undefined): string | undefined =>
  date ? new Date(date).toISOString() : undefined

export const priceAmountStructure = z.optional(
  z.object({
    amount: z.optional(z.number()),
    priceInformation: z.optional(z.string()),
  }),
)

export const fraudEnrichmentValueStructure = z.object({
  enrichment: z.string(),
  value: z.optional(z.string()), // will be deprecated, use jsonValue instead
  jsonValue: z.optional(z.string()),
})

export const mlEnrichmentValueStructure = z.object({
  enrichment: z.string(),
  jsonValue: z.optional(z.array(z.object({}))),
})

export const geoEnrichmentHierarchyValues = z.array(
  z.object({
    id: z.string(),
    level: z.number(),
  }),
)

export const geoEnrichmentValueStructure = z.object({
  enrichment: z.string(),
  jsonValue: z.optional(
    z.object({
      display: z.optional(
        z.object({
          coordinates: z.optional(z.object({ lng: z.number(), lat: z.number() })),
          inscribedPolygon: z.optional(z.string().nullish()),
          isRandomised: z.optional(z.boolean()),
        }),
      ),
      hierarchy: z.optional(z.record(z.string(), geoEnrichmentHierarchyValues)),
    }),
  ),
})

export const classifiedManagementStructure = z.object({
  classifiedId: z.string(),
  dbEntryCreationDate: z.optional(z.string()),
  metadata: z.object({
    customerId: z.string().nullish(), // will only be set for intermediary, see cleanupMetadata
    userId: z.string().nullish(), // will only be set for intermediary, see cleanupMetadata
    creationDate: z.optional(z.string().datetime({ offset: true })).transform(convertToISOString),
    updateDate: z.optional(z.string().datetime({ offset: true })).transform(convertToISOString),
    projectId: z.optional(z.string()),
    externalProjectId: z.optional(z.string()),
    classifiedBusiness: z.optional(z.string()),
    isReplayed: z.optional(z.boolean()),
  }),
  visibility: z.optional(
    z.object({
      validations: z.optional(
        z.array(
          z.object({
            portal: z.string(),
            latestPublicationDate: z.optional(z.string().datetime({ offset: true })).transform(convertToISOString),
          }),
        ),
      ),
    }),
  ),
  media: z.optional(
    z.array(
      z.object({
        avivMediaId: z.string().nullish(),
      }),
    ),
  ),
  data: z.object({
    distributionType: z.string(),
    distributionSubType: z.optional(
      z.object({
        buy: z.optional(z.string()),
        rent: z.optional(z.string()),
      }),
    ),
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
            managementSpace: z.optional(z.number()),
            minDivisible: z.optional(z.number()),
            officePartSpace: z.optional(z.number()),
            officeSpace: z.optional(z.number()),
            restaurantSpace: z.optional(z.number()),
            sellSpace: z.optional(z.number()),
            shopSpace: z.optional(z.number()),
            storageSpace: z.optional(z.number()),
          }),
        ),
      }),
    ),
    prices: z.optional(
      z.object({
        buy: z.optional(
          z.object({
            countrySpecific: z.optional(
              z.object({
                fr: z.optional(
                  z.object({
                    lifeAnnuity: priceAmountStructure,
                  }),
                ),
              }),
            ),
            price: priceAmountStructure,
            pricePerSqUnit: priceAmountStructure,
          }),
        ),
        rent: z.optional(
          z.object({
            baseRent: priceAmountStructure,
            baseRentPerYear: priceAmountStructure,
            totalRent: priceAmountStructure,
            pricePerSqUnit: priceAmountStructure,
            pricePerSqUnitPerYear: priceAmountStructure,
            operatingCosts: priceAmountStructure,
            countrySpecific: z.optional(
              z.object({
                fr: z.optional(
                  z.object({
                    overRegulatedRent: z.optional(z.number()),
                  }),
                ),
                at: z.optional(
                  z.object({
                    overallLoadGross: z.optional(
                      z.object({
                        amount: z.optional(z.number()),
                      }),
                    ),
                    rentNet: z.optional(
                      z.object({
                        amount: z.optional(z.number()),
                      }),
                    ),
                  }),
                ),
              }),
            ),
          }),
        ),
        compulsoryAuction: z.optional(
          z.object({
            minimumBid: z.optional(
              z.object({
                amount: z.optional(z.number()),
              }),
            ),
            marketValue: z.optional(
              z.object({
                amount: z.optional(z.number()),
              }),
            ),
          }),
        ),
        buyAuction: z.optional(
          z.object({
            minPrice: z.optional(
              z.object({
                amount: z.optional(z.number()),
              }),
            ),
          }),
        ),
        brokerageFee: z.optional(
          z.object({
            hasFee: z.optional(z.string()),
            feeNote: z.optional(z.object({})),
          }),
        ),
        showPrice: z.optional(z.boolean()),
      }),
    ),
    conditions: z.optional(
      z.object({
        yearOfConstruction: z.optional(z.number()),
        buildState: z.optional(z.string()),
      }),
    ),
    structure: z.optional(
      z.object({
        building: z.optional(
          z.object({
            locationInBuilding: z.optional(z.string()),
            numberOfFloors: z.optional(z.number()),
            barrierFree: z.optional(z.string()),
            bath: z.optional(
              z.object({
                window: z.optional(z.string()),
                bathtub: z.optional(z.string()),
              }),
            ),
            kitchen: z.optional(
              z.object({
                kitchenEquipment: z.optional(z.string()),
                kitchenType: z.optional(
                  z.object({
                    builtIn: z.optional(z.boolean()),
                  }),
                ),
              }),
            ),
            cellar: z.optional(z.string()),
            elevator: z.optional(
              z.object({
                person: z.optional(z.string()),
                freight: z.optional(z.string()),
              }),
            ),
          }),
        ),
        parkingLots: z.optional(
          z.object({
            box: z.optional(z.number()),
            outside: z.optional(z.number()),
            inside: z.optional(z.number()),
            streetParking: z.optional(z.number()),
            carport: z.optional(z.number()),
            hasGarage: z.optional(z.boolean()),
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
            numberOfBedRooms: z.optional(z.number()),
            numberOfBalconies: z.optional(z.number()),
            numberOfTerraces: z.optional(z.number()),
          }),
        ),
      }),
    ),
    management: z.optional(
      z.object({
        isImmediatelyAvailable: z.optional(z.boolean()),
        availableFrom: z.optional(z.string().datetime({ offset: true })).transform(convertToISOString),
        isRented: z.optional(z.boolean()),
        rent: z.optional(
          z.object({
            petsAllowed: z.optional(z.string()),
            certificateOfEligibilityNeeded: z.optional(z.string()),
            isShortTimeRental: z.optional(z.boolean()),
          }),
        ),
        useFor: z.optional(z.string()),
        isForInvestment: z.optional(z.boolean()),
        marketStatus: z.optional(z.string()),
        isForSwap: z.optional(z.boolean()),
        countrySpecific: z.optional(
          z.object({
            be: z.optional(
              z.object({
                lifeAnnuity: z.optional(z.object({})),
              }),
            ),
            fr: z.optional(
              z.object({
                legalNotes: z.optional(z.array(z.string())),
              }),
            ),
          }),
        ),
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
        wheelchairUse: z.optional(z.string()),
        furnished: z.optional(z.string()),
        residential: z.optional(
          z.object({
            flatSharePossible: z.optional(z.string()),
            swimmingPool: z.optional(z.string()),
            assistedLiving: z.optional(z.string()),
          }),
        ),
        aircondition: z.optional(z.string()),
      }),
    ),
    location: z.object({
      country: z.string().nullish(),
      geometry: z.optional(
        z.object({
          // min(2).max(3) because in theory, a third entry could contain the elevation of the point
          coordinates: z.optional(z.number().array().min(2).max(3)),
          type: z.optional(z.literal('Point')),
        }),
      ),
      avivGeoId: z.string().nullish(),
      floorNumber: z.number().nullish(),
      showAddress: z.optional(z.boolean()),
      countrySpecific: z.optional(
        z.object({
          fr: z.optional(
            z.object({
              addressDisplayPreference: z.optional(z.string()),
            }),
          ),
        }),
      ),
    }),
    energy: z.optional(
      z.object({
        energyType: z.optional(
          z.object({
            heatMethod: z.optional(z.string()),
            heatForm: z.optional(
              z.object({
                air: z.optional(z.boolean()),
                radiator: z.optional(z.boolean()),
                stove: z.optional(z.boolean()),
                underfloor: z.optional(z.boolean()),
                wallCeiling: z.optional(z.boolean()),
                mixed: z.optional(z.boolean()),
              }),
            ),
            energySource: z.optional(
              z.object({
                coal: z.optional(z.boolean()),
                districtHeating: z.optional(z.boolean()),
                electric: z.optional(z.boolean()),
                gas: z.optional(z.boolean()),
                geothermal: z.optional(z.boolean()),
                liquidGas: z.optional(z.boolean()),
                oil: z.optional(z.boolean()),
                solarHeat: z.optional(z.boolean()),
                solarPower: z.optional(z.boolean()),
                wind: z.optional(z.boolean()),
                wood: z.optional(z.boolean()),
                woodPellet: z.optional(z.boolean()),
                hasThermicPanels: z.optional(z.boolean()),
                hasPhotovoltaicPanels: z.optional(z.boolean()),
              }),
            ),
            energyGeneration: z.optional(
              z.object({
                fossilburning: z.optional(z.boolean()),
                heatpump: z.optional(z.boolean()),
                combinedHeatAndPowerPlant: z.optional(z.boolean()),
              }),
            ),
          }),
        ),
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
    buildingProperty: z.optional(
      z.object({
        program: z.optional(
          z.object({
            deliveryDate: z.string().nullish(),
          }),
        ),
      }),
    ),
    texts: z.optional(
      z.object({
        headline: z.optional(
          z.object({
            fr: z.optional(z.string().nullish()),
            de: z.optional(z.string().nullish()),
          }),
        ),
        description: z.optional(
          z.object({
            fr: z.optional(z.string().nullish()),
            de: z.optional(z.string().nullish()),
          }),
        ),
        features: z.optional(
          z.object({
            fr: z.optional(z.string().nullish()),
            de: z.optional(z.string().nullish()),
          }),
        ),
        extendedInformation: z.optional(
          z.object({
            fr: z.optional(z.string().nullish()),
            de: z.optional(z.string().nullish()),
          }),
        ),
        area: z.optional(
          z.object({
            fr: z.optional(z.string().nullish()),
            de: z.optional(z.string().nullish()),
          }),
        ),
      }),
    ),
    countrySpecific: z.optional(
      z.object({
        fr: z.optional(
          z.object({
            agentMandate: z.optional(
              z.object({
                mandateType: z.optional(z.string()),
              }),
            ),
          }),
        ),
      }),
    ),
  }),
  enrichedData: z.optional(
    z.object({
      enrichments: z.optional(
        z.array(
          z.object({
            enrichmentType: z.string(),
            enrichmentValues: z.array(
              fraudEnrichmentValueStructure.or(mlEnrichmentValueStructure).or(geoEnrichmentValueStructure),
            ),
          }),
        ),
      ),
    }),
  ),
  specifics: z.optional(
    z.object({
      extraction: z.optional(
        z.object({
          features: z.optional(
            z.object({
              cellar: z.optional(z.boolean()),
              garage: z.optional(z.boolean()),
              garden: z.optional(z.boolean()),
              houseboat: z.optional(z.boolean()),
              flatSharePossible: z.optional(z.boolean()),
            }),
          ),
        }),
      ),
      de: z.optional(
        z.object({
          iwtStellplatzAnzahl: z.optional(z.number()),
        }),
      ),
    }),
  ),
})

export type FraudEnrichmentValueStructure = z.infer<typeof fraudEnrichmentValueStructure>
export type GeoEnrichmentHierarchyValues = z.infer<typeof geoEnrichmentHierarchyValues>
export type GeoEnrichmentValueStructure = z.infer<typeof geoEnrichmentValueStructure>
export type PriceAmountStructure = z.infer<typeof priceAmountStructure>
export type ClassifiedManagementStructure = z.infer<typeof classifiedManagementStructure>// & MandatoryMessageData
export type ClassifiedManagementLocationStructure = ClassifiedManagementStructure['data']['location']
