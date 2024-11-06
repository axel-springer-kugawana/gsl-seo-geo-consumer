import { EnergyCertificateAt } from "./energy-certificate-at";
import { EnergyCertificateDe } from "./energy-certificate-de";
import { EstateSubType } from "./estate-sub-type";
import { EstateType } from "./estate-type";
import { Features } from "./features";
import { Prices } from "./prices/prices";


// KEEP UPDATE FROM https://github.com/axel-springer-kugawana/aviv_architecture_backend_guild/tree/main/samples/classified-management-connector/src


export interface MultiLingualText {
  de?: string;
  fr?: string;
  en?: string;
  be?: string;
}

export interface Classified {
  classifiedId: string;
  updateAt?: number;
  data?: {
    estateType: EstateType;
    estateSubType?: EstateSubType;
    distributionType: 'BUY' | 'RENT' | 'COMPULSORY_AUCTION' | 'BUY_AUCTION';
    location?: Location;
    texts?: {
      headline?: MultiLingualText;
      description?: MultiLingualText;
      features?: MultiLingualText;
      extendedInformation?: MultiLingualText;
      area?: MultiLingualText;
    };
    energy?: {
      energyType?: {
        heatMethod?: 'CENTRAL' | 'INDIVIDUAL' | 'STOREY';
        heatForm?: {
          air: boolean;
          radiator: boolean;
          stove: boolean;
          underfloor: boolean;
          wallCeiling: boolean;
        };
        energySource?: {
          coal: boolean;
          districtHeating: boolean;
          electric: boolean;
          gas: boolean;
          geothermal: boolean;
          liquidGas: boolean;
          oil: boolean;
          solarHeat: boolean;
          solarPower: boolean;
          wind: boolean;
          wood: boolean;
          woodPellet: boolean;
        };
        energyGeneration?: {
          fossilburning: boolean;
          heatpump: boolean;
          combinedHeatAndPowerPlant: boolean;
        };
        maxElectricalPower?: number;
      };
      countrySpecific?: {
        de?: {
          energyCertificates?: EnergyCertificateDe[];
          houseEnergyStandardType?:
            | 'UNSPECIFIED'
            | 'LOW_ENERGY_40'
            | 'LOW_ENERGY_60'
            | 'PASSIVE_HOUSE'
            | 'ENERGY_EFFICIENT_40'
            | 'ENERGY_EFFICIENT_55'
            | 'ENERGY_EFFICIENT_70'
            | 'LOW_ENERGY_HOUSE'
            | 'NULL_ENERGY_HOUSE'
            | 'PLUS_ENERGY_HOUSE';
        };
        fr?: any;
        at?: {
          energyCertificate?: EnergyCertificateAt[];
        };
        ch?: {
          /**
           * @description building is constructed according to Minergie standards, means with low-energy-consumption
           * @example true
           */
          isMinergieConstruction?: boolean;
          /**
           * @description building has a certificate according to the Minergie contruction style
           * @example true
           */
          isMinergieCertified?: boolean;
        };
        be?: any;
      };
    };
    prices: Prices;
    /** @description contains different space types for a property. you can submit multiple spaces here (e.g. livingSpace, atticSpace and gardenSpace) */
    spaces?: {
      /**
       * @description measure unit for the space.
       * @enum {string}
       */
      spaceMeasureUnit:
        | 'SQUARE_METER'
        | 'SQUARE_INCH'
        | 'SQUARE_FOOT'
        | 'SQUARE_YARD'
        | 'HECTARE'
        | 'ACRE';
      /** @description building front facade length in meter */
      buildingFront?: number;
      /** @description space of the kitchen */
      kitchenSpace?: number;
      /** @description total space of the property */
      overallSpace?: number;
      /** @description space that can be used, after deducting functional areas, stairs, etc. depending on the purpose */
      usableFloorSpace?: number;
      /** @description For a catalog house or a new built house or a program, the biggest property available, built or not yet built. If a property has different units/ spaces, this is the biggest space it has */
      spaceMax?: number;
      /** @description For a catalog house or a new built house or a program, the smallest property available, built or not yet built. If a property has different units/ spaces, this is the smallest space it has */
      spaceMin?: number;
      /** @description space of the plot */
      plotSpace?: number;
      /** @description plot front in meter */
      plotFront?: number;
      /** @description contains all cumulated additional space from outbuilding, extended or misc places. */
      additionalSpace?: number;
      /** @description residential / living space types with their value. */
      residential?: {
        /** @description core space within a building in which people may live */
        livingSpace?: number;
        /** @description space of the livingroom in a house or apartment */
        livingRoomSpace?: number;
        /** @description space directly under the roof of a building */
        atticSpace?: number;
        /** @description space of the balcony, seperated to terrace */
        balconySpace?: number;
        /** @description cellar space of the building or that belongs to the assigned unit, eg apartment, office */
        cellarSpace?: number;
        /** @description space of the garden */
        gardenSpace?: number;
        /** @description space of the terrace, separated to balcony */
        terraceSpace?: number;
      };
      /** @description commercial space types with their value. */
      commercial?: {
        /** @description if a space can be divided, this is the maximum divisible space; not to be mixed up with the field spaceMax; not divisions and not a sum of divisions either. */
        maxDivisible?: number;
        /** @description if a space can be divided, this is the minimum divisible space; not to be mixed up with the field spaceMin; not divisions and not a sum of divisions either. */
        minDivisible?: number;
        /** @description amount of the space used for commercial purposes */
        commercialSpace?: number;
        /** @description space of a shop or store */
        shopSpace?: number;
        /** @description space of the storage area */
        storageSpace?: number;
        /** @description refers to the area used for sales, in the retail and service sectors */
        sellSpace?: number;
        /** @description space of the office */
        officeSpace?: number;
        /** @description space of a single office unit in an office building with several units */
        officePartSpace?: number;
        /** @description area used for administrative or management purposes */
        managementSpace?: number;
        /** @description Amount of the restaurant space */
        restaurantSpace?: number;
        /** @description Complementary spaces inside the property, which type is different of the main one. Can be used for a shop also having an appartment, ... */
        complementarySpaces?: {
          /**
           * @description Complementary space's estate type (listed in estateType section)
           * @example APARTMENT
           */
          complementarySpaceType?: string;
          /**
           * @description Complementary space's estate sub-type (listed in estateSubType sections).
           * @example SINGLEROOM
           */
          complementarySpaceSubType?: string;
          /**
           * @description Its Overall Space of in square unit
           * @example 30.5
           */
          complementarySpaceArea?: number;
        }[];
      };
    };
    structure?: Structure;
    management?: Management;
    features?: Features;
    /** @description Condition information of the property. */
    conditions?: {
      /**
       * @description What is the current condition of the property?
       * @enum {string}
       */
      buildState?:
        | 'FIRST_TIME_USE'
        | 'FIRST_TIME_USE_AFTER_REFURBISHMENT'
        | 'MINT_CONDITION'
        | 'MODERNISED'
        | 'REFURBISHED'
        | 'FULLY_RENOVATED'
        | 'PARTLY_RENOVATED'
        | 'NEED_OF_RENOVATION'
        | 'WELL_KEPT'
        | 'NEGOTIABLE'
        | 'RIPE_FOR_DEMOLITION'
        | 'PROJECTED'
        | 'NO_INFORMATION'
        | 'RESTRUCTURED';
      /**
       * @description the age of the building: OLD is defined as built before 1945. NEW is defined as built within the last 5 years.
       * @enum {string}
       */
      ageState?: 'OLD' | 'NEW';
      /**
       * @description year of construction
       * @example 1975
       */
      yearOfConstruction?: number;
      /**
       * @description last year of modernisation
       * @example 2010
       */
      lastModernisation?: number;
      /**
       * @description General construction style of tbe building
       * @enum {string}
       */
      constructionStyle?:
        | 'PREFABRICATED'
        | 'SOLID'
        | 'SOLID_PREFABRICATED'
        | 'TIMBERHOUSE'
        | 'WOOD_PREFABRICATED'
        | 'UNSPECIFIED';

      /**
       * @description construction year if it's not just a number
       * @example Altbau um die 1912
       */
      iwtLegacyBaujahr?: string;
    };
  };
  metadata: {
    externalId?: string;
    brand: 'IWB' | 'IWT' | 'GSL' | 'MA';
    customerId: string;
    creationDate: string;
    updateDate: string;
    offererEstateId: string;
    offererMarketingKey: string;
    projectId: string;
  };
  media?: Media[];
  specifics?: Specifics;
  visibility?: {
    requests?: {
      portal: 'SL' | 'LI' | 'LR' | 'BD' | 'BUCOM' | 'IWB' | 'IWT' | 'IMMONET';
    }[];
  };
}

export enum Orientation {
  'NORTH' = 'NORTH',
  'EAST' = 'EAST',
  'SOUTH' = 'SOUTH',
  'WEST' = 'WEST',
  'NORTH_EAST' = 'NORTH_EAST',
  'SOUTH_EAST' = 'SOUTH_EAST',
  'NORTH_WEST' = 'NORTH_WEST',
  'SOUTH_WEST' = 'SOUTH_WEST',
}

export interface Structure {
  building?: {
    /**
     * @description - CONVERTED: attic can be used as a living space. - PART_CONVERTED: attic is part converted, can be used as a living space but part of the space is still convertible - CONVERTIBLE: There is an attic, but work is required to use it as a living space.
     * @enum {string}
     */
    attic?: 'CONVERTED' | 'PART_CONVERTED' | 'CONVERTIBLE';
    /** @description geographical orientation of the biggest balcony or terrace */
    balconyDirection?: Orientation;
    /** @description geographical orientation of the biggest garden */
    gardenDirection?: Orientation;
    /**
     * @description property is accessible to people with mobility difficulties
     * @enum {string}
     */
    barrierFree?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @description Bathroom equipment - multiple choice possible */
    bath?: {
      /** @enum {string} */
      shower?: 'YES' | 'NO' | 'NOT_APPLICABLE' | 'ROMAN_SHOWER';
      /** @enum {string} */
      bathtub?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      window?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      bidet?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      urinal?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      guestToilet?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      separateBathAndToilet?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      toilet?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      bathroomSink?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    };
    /**
     * @description cellar present
     * @enum {string}
     */
    cellar?: 'YES' | 'NO' | 'PART' | 'NOT_APPLICABLE';
    /**
     * @description elevator type - not specified; passenger elevator or freight elevator
     * @example [object Object]
     */
    elevator?: {
      /** @enum {string} */
      person?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      freight?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    };
    /** @description kitchen options */
    kitchen?: {
      kitchenType?: {
        /** @description kitchen facilities and cabinets are fitted to the room providing a seamless, integrated look */
        builtIn?: boolean;
        /** @description small cooking area usually with only basic facilities like refrigerator, hotplate and sink. Sometimes this is even hidden in a closet. */
        kitchenette?: boolean;
        /** @description an open-concept kitchen without walls separating it from the rest of the property. */
        open?: boolean;
        /** @description the kitchen is a room of its own, separated from the rest of the living area. */
        separated?: boolean;
      };
      /** @enum {string} */
      kitchenEquipment?: 'NONE' | 'STORAGE' | 'FULLY_EQUIPPED';
      /** @enum {string} */
      pantry?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      singleStorey?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    };
    /** @description total number of floors of a building. e.g. a house is rented, it has 2 floors -> numberOfFloors: 2 an 5 floor office building is sold ->  numberOfFloors: 5'total number of floors in the building' */
    numberOfFloors?: number;
    numberOfFacades?: number;
    /**
     * @description room height in m ; if there are several different buildings, put in the maximal room height
     * @example 3.2
     */
    roomHeight?: number;
    /** @description special case! refers to the number of floors explicitly offered on a property, e.g. a multistorey appartment can have 2 (duplex) or 3 (triplex) floors. ATTENTION! not to be confused with numberOfFloors! */
    offeredFloors?: number;
    /**
     * @description Style of the roof
     * @enum {string}
     */
    roofStyle?:
      | 'HALF_HIPPED_ROOF'
      | 'GAMBREL'
      | 'MONO_PITCHED_ROOF'
      | 'GABLE'
      | 'HIP_ROOF'
      | 'FLAT_ROOF'
      | 'PYRAMIDAL_ROOF'
      | 'OTHER';
    /**
     * @description Location of the apartment in the building - GROUNDFLOOR: apartment is located on the ground floor,
     *   so usually you do not have stairs
     * - HALF_BASEMENT: apartment is located half below ground,
     *   so that it can still have windows to let in daylight
     * - ROOF_STOREY: apartment is located directly under the roof
     *   with sloping ceiling
     * @enum {string}
     */
    locationInBuilding?: 'GROUNDFLOOR' | 'HALF_BASEMENT' | 'ROOF_STOREY';
    /**
     * @description the property is located at the corner of two streets
     * @enum {string}
     */
    locationAtCorner?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    calm?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @description view(s) from the property which can be important for price estimation */
    withView?: {
      /** @description with a view on the courtyard */
      courtyardView?: boolean;
      /** @description with a view on the lake */
      lakeView?: boolean;
      /** @description with a view on the mountain */
      mountainView?: boolean;
      /** @description view when it cannot be seen from any other buildings */
      overlooking?: boolean;
      /** @description with a view on the sea */
      seaView?: boolean;
      /** @description with a view on the ski slope */
      skiView?: boolean;
    };
    /** @enum {string} */
    luminous?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    window?: {
      /**
       * @description presence of a bay window
       * @enum {string}
       */
      bayWindow?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /**
       * @description presence of blinds on the windows
       * @enum {string}
       */
      blinds?: 'YES' | 'NO' | 'NOT_APPLICABLE' | 'ELECTRIC' | 'MANUAL';
      windowMaterial?: {
        /**
         * @description presence of wooden windows
         * @enum {string}
         */
        woodenWindows?: 'YES' | 'NO' | 'NOT_APPLICABLE';
        /**
         * @description presence of aluminium windows
         * @enum {string}
         */
        aluminiumWindows?: 'YES' | 'NO' | 'NOT_APPLICABLE';
        /**
         * @description presence of muntin windows
         * @enum {string}
         */
        muntinWindows?: 'YES' | 'NO' | 'NOT_APPLICABLE';
        /**
         * @description presence of plastic windows
         * @enum {string}
         */
        plasticWindows?: 'YES' | 'NO' | 'NOT_APPLICABLE';
        /** @enum {string} */
        insulatedGlazing?:
          | 'YES'
          | 'NO'
          | 'NOT_APPLICABLE'
          | 'SIMPLE'
          | 'DOUBLE'
          | 'TRIPLE';
      };
    };
    /**
     * @description The shape of the house represents the external form of the house.
     * @enum {string}
     */
    shape?:
      | 'L_SHAPE'
      | 'U_SHAPE'
      | 'V_SHAPE'
      | 'RECTANGULAR'
      | 'SQUARE'
      | 'OTHER';
    /**
     * @description the property has at least one floor which level is between 2 other floors. This floor is not directly above or below these other floors. A "half floor" or a split floor.
     * @example true
     */
    hasSplitFloor?: boolean;
    /** @description The main materials used to build the wall of the building. */
    wallConstructionMaterial?: (
      | 'MASSIVE_WOOD'
      | 'CINDER_BLOCK'
      | 'INSULATING_CINDER_BLOCK'
      | 'CELLULAR_CONCRETE'
      | 'BRICK'
      | 'HONEYCOMB_BRICK'
      | 'LIMESTONE'
      | 'WOOD_FRAME'
      | 'METAL_FRAME'
    )[];
  };
  rooms?: {
    /**
     * @description number of rooms available in the property. Floating point numbers may also be used here, because half rooms are possible.
     * @example 2
     */
    numberOfRooms?: number;
    /**
     * @description number of bedrooms
     * @example 1
     */
    numberOfBedRooms?: number;
    /**
     * @description number of bathrooms
     * @example 1
     */
    numberOfBathRooms?: number;
    /**
     * @description number of toilets
     * @example 1
     */
    numberOfToilets?: number;
    /** @description number of balconies */
    numberOfBalconies?: number;
    /**
     * @description number of terraces (+ stalls for shops)
     * @example 1
     */
    numberOfTerraces?: number;
    /** @description number of kitchens */
    numberOfKitchens?: number;
    /**
     * @description number of units (residential or commercial)
     * @example 1
     */
    numberOfUnits?: number;
  };
  commercial?: {
    /** @description maximal floor load for the property, expressed in Kg/m2 */
    floorLoad?: number;
    /** @description maximal floor load for the upper floors of the property, expressed in Kg/m2 */
    floorLoadUpperFloors?: number;
    /**
     * @description hall height in m; if there are several different buildings, put in the maximal room height
     * @example 1.5
     */
    hallHeight?: number;
    /**
     * @description number of beds in total (single and double beds included)
     * @example 1
     */
    numberOfBeds?: number;
    /** @description number of loading docks for trucks */
    numberOfLoadingDocks?: number;
    numberOfDesks?: number;
    numberOfMeetingRooms?: number;
    numberOfOfficeRooms?: number;
    /**
     * @description window front in space measure unit
     * @example 1.2
     */
    windowFront?: number;
  };
  /** @description number of available parking spaces that belong to the property */
  parkingLots?: {
    /** @description number of parking spaces that are outside, not in a garage */
    outside?: number;
    /** @description number of parking spaces along the street */
    streetParking?: number;
    /** @description number of carports (a shelter for vehicles that is open-sided and usually attached to a house) */
    carport?: number;
    /** @description number of garages (building for parking one vehicle usually with a vertical rolling door) */
    garage?: number;
    /** @description number of doubleGarages (like a garage but for two vehicles) */
    doubleGarage?: number;
    /** @description number of duplex parking spaces (double parking on one parking space with a parking lift) */
    duplex?: number;
    /** @description number of garages in a garagesArea (with several garages only, no houses attached) */
    garageArea?: number;
    /** @description number of parking lots (in a confined area full of parking spaces) */
    parkingArea?: number;
    /** @description number of parking spaces in a carPark (usually multistorey car park building) */
    carPark?: number;
    /** @description number of parking spaces in a undergroundGarage (car park mainly below earth) */
    underground?: number;
    /** @description number of parkings for a boat (a berth) */
    boatDock?: number;

    iwtLegacyStellplatzAnzahl?: number;
  };
  countrySpecific?: {
    fr?: {
      maximalCapacityOfPersons?: number;
      /**
       * @description COS, maximum occupancy rate of a property by buildings built on it
       * @example 0.2
       */
      coefficientOccupationDesSols?: number;
      /**
       * @description CES, actual occupancy rate of a property by the building(s) built on it
       * @example 0.4
       */
      coefficientEmpriseAuSol?: number;
      /**
       * @description height between the floor and the bottom of a door, in cm
       * @example 2.5
       */
      heightUnderDoor?: number;
    };
  };
}

/** @description geographical information of the real estate property */
export interface Location {
  /**
   * @description aviv geo place id
   * @example NBH2DE75626
   */
  avivGeoId?: string;
  /**
   * @description postalcode or zip of the property location
   * @example 22455
   */
  postalcode: string;
  /**
   * @description city where the property is located
   * @example Hamburg
   */
  city: string;
  /**
   * @description street where the property is located. it can also be a place name or any required neighbourhood information
   * @example Hauptstrasse
   */
  street: string;
  /**
   * @description house number where the property is located. It can be empty when not applicable. Use an empty string for unknown value.
   * @example 10
   */
  houseNumber: string;
  /**
   * @description An apartment, unit, office, lot, or other secondary unit designator
   * @example Block C
   */
  unit?: string;
  /**
   * @description numbered/lettered staircase
   * @example A
   */
  staircase?: string;
  /**
   * @description number of the floor in the building; 0 means ground floor, NOT first floor; 1 means first upper floor; -1 means first basement floor
   * @example 2
   */
  floorNumber?: number;
  /**
   * @description numbered/lettered entrance
   * @example 123
   */
  entrance?: string;
  /**
   * @description state within the country where the property is located
   * @example Bavaria
   */
  state?: string;
  /**
   * @description country where the property is located
   * @example Germany
   */
  country: string;
  /** @description Coordinates of the property using geoJSON format. WGS84 (GPS) System expected. */
  geometry?: {
    type: 'point';
    coordinates: [number, number];
  };
  /** @description additional Information about the area where the object is located. the information can  be transmitted in several languages. The corresponding data element therefore is an object and contains data elements which contain the language abbreviation in ISO 639-1 as a name. */
  locationNote?: MultiLingualText;
  /**
   * @description may the complete address be visible to everyone who sees the property online? if false, street and houseNumber may not be displayed in any case!
   * @example true
   */
  showAddress?: boolean;
  countrySpecific?: {
    /** @description official geographical information for plots, especially for Germany */
    de?: {
      /**
       * @description government map number from the land registry office, de: Flurnummer
       * @example 3
       */
      govMapNo?: string;
      /**
       * @description government map from the land registry office, de: Flurstück
       * @example 35
       */
      govMapPart?: string;
      /**
       * @description city of the government, de: Grundbuch Ort, Gemarkung, Vermessungsbezirk
       * @example Musterstadt
       */
      govRegisterPlace?: string;
      /**
       * @description government register number, de: Grundbuch Blatt
       * @example 73
       */
      govRegisterNo?: string;

      /**
       * @description iwt userdefined field for RED stream used to transmit legacy dbo.Objektangebote.GeoID legacy geo reference
       */
      iwtLegacyGeoID?: string;

      iwtLegacyLocationId?: number;
    };
    fr?: {
      /** @description Govt Localisation Code INSEE */
      inseeCode?: string;
    };
  };
}

export interface Management {
  /**
   * @description is ready for immediate use
   * @example true
   */
  isImmediatelyAvailable?: boolean;
  /**
   * Format: date-time
   * @description available for use from this date and time; the date-time is an ISO 8601 formatted string
   * @example 2019-03-15T11:30:00Z
   */
  availableFrom?: string;
  /**
   * Format: date-time
   * @description only available for use until this date and time; the date-time is an ISO 8601 formatted string
   * @example 2019-03-15T11:30:00Z
   */
  availableUntil?: string;
  /**
   * @description suitable as investment
   * @example true
   */
  isForInvestment?: boolean;
  /**
   * @description is the property under a preservation order
   * @example NOT_APPLICABLE
   * @enum {string}
   */
  heritageProtected?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  /**
   * @description marketing status of the property, is it currently sold, rented, under offer, etc. Options cannot be combined! fr: UNDER_OFFER si le bien est sous compromis
   * @enum {string}
   */
  marketStatus?: 'SOLD' | 'RENTED' | 'REFERENCE' | 'RESERVED' | 'UNDER_OFFER';
  /**
   * @description project status of the new built, new or under  construction property project: - BUILDING_PERMISSION: Avant premiere. Building permission given - COMMERCIAL_LAUNCH: Starting commercial offers - CONSTRUCTION_START: Launch of the construction - UNDER_CONSTRUCTION: under construction. More details in the following parameters - SHELL_WORKS: under construction of the structure of the building shell works. - FINISHING_WORKS: under construction, finishing building. - LAST_CHANCE: last opportunities in the project. - PROJECT_ENDED: project ended
   * @enum {string}
   */
  projectStatus?:
    | 'BUILDING_PERMISSION'
    | 'COMMERCIAL_LAUNCH'
    | 'CONSTRUCTION_START'
    | 'UNDER_CONSTRUCTION'
    | 'SHELL_WORKS'
    | 'FINISHING_WORKS'
    | 'LAST_CHANCE'
    | 'PROJECT_ENDED';
  /**
   * @description additional to marketStatus; can be use eg on the realtor's website.
   * @example property of the week
   */
  marketLabel?: string;
  /**
   * @description is the purchasing property currently rented; de: ist das Kaufobjekt aktuell vermietet; fr: Indique si murs occupés ou murs libres pour un fonds de commerce
   * @example true
   */
  isRented?: boolean;
  /**
   * @description Info on the usage of the property
   * @enum {string}
   */
  useFor?: 'LIVING' | 'COMMERCIAL' | 'MIXED' | 'OFFICE' | 'INDUSTRIAL';
  /**
   * @description can be rented as holiday property to other people
   * @example true
   */
  isForHolidayRental?: boolean;
  /** @description management info on rental properties */
  rent?: {
    /**
     * @description favoured gender;
     * @example MALE
     * @enum {string}
     */
    favouredGender?: 'MALE' | 'FEMALE' | 'OTHER';
    /**
     * @description minimum of the tenancy; see rentalTimeUnit for the unit; can also be used for lease (duration of the lease)
     * @example 1
     */
    minRentalTime?: number;
    /**
     * @description maximum of the tenancy; see rentalTimeUnit for the unit;
     * @example 3
     */
    maxRentalTime?: number;
    /**
     * @description unit of the tenancy or the lease duration
     * @example YEAR
     * @enum {string}
     */
    rentalTimeUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
    /**
     * @description a special certificate is needed to rent the apartment due to social or other regulation
     * @example YES
     * @enum {string}
     */
    certificateOfEligibilityNeeded?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description max. nr of persons;
     * @example 1
     */
    maxPersons?: number;
    /**
     * @description Nonsmoker
     * @example NOT_APPLICABLE
     * @enum {string}
     */
    nonSmoker?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description pets allowed
     * @example NOT_APPLICABLE
     * @enum {string}
     */
    petsAllowed?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description often associated with furnished accommodation (rooms, flats or houses) which are available for a limited period of time. its mainly used by students, young professionals, consultants and commuters who live in a city for a certain period of time (often project-, job- or study-related). short term living must not be confused with holiday flats!
     * @example true
     */
    isShortTimeRental?: boolean;
  };
  compulsoryAuction?: {
    /** @description Place where the auction is held, usually the court. */
    auctionLocation?: string;
    /** @description room number in court where the auction is held */
    auctionSpace?: string;
    /**
     * Format: date
     * @description Date when a auction is stopped. The date is an ISO 8601 formatted string. de:aufhebungsTermin
     */
    cancellationDate?: string;
    /** @description second owner */
    coOwnership?: string;
    /**
     * @description court city name of the auction de: Amtsgericht
     * @example Berlin Charlottenburg
     */
    countyCourt?: string;
    /**
     * Format: date-time
     * @description Date and time of the compulsory auction. The date is an ISO 8601 formatted string
     * @example 2019-03-15T11:30:00Z
     */
    dateOfAuction?: string;
    /**
     * @description Sale opportunity before the official auction de: Freihandverkauf
     * @example true
     */
    isDiscretionarySale?: boolean;
    /** @description Managment number of a unit in a building de: Aufteilungsnummer */
    distributionPlanNumber?: string;
    /** @description reference number of the county court de:amtsgerichtKennung */
    fileReferenceAtCountyCourt?: string;
    /**
     * Format: date-time
     * @description Date when the last change was made to the information of the auction. The date is an ISO 8601 formatted string.
     * @example 2019-03-15T11:30:00Z
     */
    lastChangeDate?: string;
    /** @description insolvency administrator de:  Zwangsverwalter/Insolvenzverwalter */
    insolvencyAdministrator?: string;
    /** @description the owner of the property */
    owner?: string;
    /**
     * Format: date-time
     * @description when the property was registered as compulsory auction. The date is an ISO 8601 formatted string. de: Aufnahmedatum
     */
    recordationDate?: string;
    /**
     * Format: date-time
     * @description Additional date for the auction. The date is an ISO 8601 formatted string. de: Zusatztermin
     * @example 2019-03-15T11:30:00Z
     */
    additionalDate?: string;
    /**
     * @description if true, it means: free bidding at second auction date, there are no value limits anymore according to the market value. de: Wertgrenzen weggefallen
     * @example true
     */
    isWithoutValueLimits?: boolean;
    /**
     * @description auction mode if property is owned by more than one person de: Teilungsversteigerung
     * @example true
     */
    isSplittingAuction?: boolean;
  };
  countrySpecific?: {
    fr?: {
      /**
       * @description building Usage change fr: Changement d'usage en accord avec le code de la construction et de l'habitation
       * @example true
       */
      isUsageChange?: boolean;
      /**
       * @description Urban destination change. fr: Changement de destination en accord avec le code de l'urbanisme
       * @example true
       */
      isDestinationChange?: boolean;
      /**
       * @description Is the property in a condominium (co-pro) ?
       * @example true
       */
      isCondo?: boolean;
      /**
       * @description Number of lots in the condominium (nombre de lots)
       * @example 2
       */
      numberOfUnits?: number;
      /**
       * @description Name of the lot in the condominium
       * @example LOT NAME
       */
      unitDescription?: string;
      /**
       * @description Average annual amount of the share of the provisional budget of current expenditure
       * @example 2.1
       */
      operatingCostsPerYear?: number;
      /** @description Is the syndicate of co-owners subject to a procedure? */
      isSyndicProcedure?: boolean;
      /** @description Details on the current procedure of the syndicate of co-owners. */
      procedureDetails?: string;
      /**
       * @description commercial lease nature: tacitely renewed every 3 years(bail 3 6 9  or exempted (derogatory)
       * @example DEROGATORY
       * @enum {string}
       */
      commercialLease?: 'LEASE_3_6_9_YEARS' | 'DEROGATORY';
      /**
       * Format: date
       * @description End date of the commercial lease
       * @example 2021-07-10
       */
      commercialLeaseEndDate?: string;
      /**
       * @description Is there any lease back for the new renter fr: Indique si il y a une cession du bail commercial pour le nouveau locataire
       * @enum {string}
       */
      leaseBack?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /**
       * @example YES
       * @enum {string}
       */
      certificationERP?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /**
       * @example YES
       * @enum {string}
       */
      certificationDGNB?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /**
       * @example YES
       * @enum {string}
       */
      certificationBREEAM?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /**
       * @description Toute exploitation industrielle ou agricole susceptible de créer des risques ou de provoquer des pollutions ou nuisances, notamment pour la sécurité et la santé des riverains est une installation classée.
       * @example YES
       * @enum {string}
       */
      ICPE?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @description When a property is sold as life anuity, is it occupied or not. */
      unoccupiedLifeAnnuity?: boolean;
    };
  };

  iwtLegacyBezugAb?: string;
}

export interface Media {
  avivMediaId: string;
  description?: string;
}

export interface Specifics {
  de?: SpecificDe;
}

interface SpecificDe {
  iwtPrimaerEnergieTraeger?: string[];
  iwtContactId?: string;
  iwtBezugAb?: string;
  iwtStellplatzAnzahl?: number;
  iwtBaujahr?: string;
}