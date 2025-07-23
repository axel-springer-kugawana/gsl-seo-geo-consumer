/** @description Feature information for the property */
import { Orientation } from './classified';

export interface Features {
  /**
   * @description can the property be accessed directly from street.
   * @enum {string}
   */
  accessibleFromStreet?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  /**
   * @description aircondition available
   * @example YES
   * @enum {string}
   */
  aircondition?: 'YES' | 'PART' | 'NO' | 'NOT_APPLICABLE';
  /**
   * @description iwt userdefined field for RED stream used to transmit legacy dbo.ObjektAusstattung Abstellraum small storage room
   * @example YES
   * @emits, {string}
   */
  iwtLegacyAbstellraum?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  /**
   * @description has the property an entrance hall or has it a direct access to the rooms ?
   * @enum {string}
   */
  entranceHall?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  /** @description General floor covering */
  floorCovering?: {
    /** @enum {string} */
    tiles?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    stone?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    carpet?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    parquet?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    laminate?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    synthetic?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    screed?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    linoleum?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    marble?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    terracotta?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    granite?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description provides an elevated structural floor above a solid substrate to create a hidden void for the passage of mechanical and electrical services.
     * @enum {string}
     */
    raisedFloor?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    quartz?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    concrete?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    antiDustConcrete?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    woodenPlank?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    antiStatic?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    vinyl?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  };
  /**
   * @description is the property equipped, is furniture in there?
   * @enum {string}
   */
  furnished?: 'PART' | 'FULL' | 'NO' | 'NOT_APPLICABLE';
  /** @description info about a garden belonging to the property */
  garden?: {
    part?: boolean;
    private?: boolean;
    shared?: boolean;
  };
  /**
   * @description presence of a gym in the building
   * @enum {string}
   */
  gym?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  internet?: {
    /**
     * @description available internet speed in Mbit/s
     * @example 100
     */
    internetSpeedMbit?: number;
    /** @description physical connections of the building to the internet network */
    internetAvailability?: {
      /** @description Fiber to the x (FTTX; also spelled "fibre") is a generic term for any broadband network architecture using optical fiber */
      opticalFiber?: boolean;
      /**
       * @description Digital subscriber line (DSL or xDSL) is a family of technologies that are used to transmit digital data over telephone lines
       * @example true
       */
      dsl?: boolean;
      /** @description Cable modem is a type of network bridge that provides bi-directional data communication */
      cable?: boolean;
      /** @description Satellite Internet access is provided through communication satellites */
      satellite?: boolean;
    };
    /** @description type(s) of internet connection currently used in the property */
    propertyInternetAccess?: {
      ethernet?: boolean;
      /** @example true */
      wireless?: boolean;
    };
  };
  lighting?: {
    /**
     * @description lights at the ceiling
     * @enum {string}
     */
    ceiling?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description LED is used as light source
     * @enum {string}
     */
    led?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description natural light through the presence of windows
     * @enum {string}
     */
    window?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  };
  /**
   * @description an intermediate floor between levels of a building, used for increasing the floor area. can be used for countless applications like living, storage, work operations, etc
   * @enum {string}
   */
  mezzanine?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  /** @description Main geographical orientation of the property. e.g. orientation of the living room for residential properties */
  propertyOrientation?: Orientation;
  /**
   * @description presence of a receptionist in the building
   * @enum {string}
   */
  receptionist?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  /** @description already available security features */
  security?: {
    /**
     * @description allows residents to talk to visitors (and possibly see them on video) before granting them access to the building.
     * @enum {string}
     */
    buildingIntercom?: 'YES' | 'NO' | 'NOT_APPLICABLE' | 'VIDEO';
    /**
     * @description camera surveillance is available
     * @enum {string}
     */
    cam?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description presence of a security service in the building
     * @enum {string}
     */
    custodian?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description room for the security personnel is available in the building
     * @enum {string}
     */
    custodianRoom?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description digital or electronic locks do not require the use of physical key for access, they work by the use of e.g. RFIDs (badges, keyCards), PinCodes, fingerprints
     * @enum {string}
     */
    digitalLock?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description in the event of an alarm, police or security will be called
     * @enum {string}
     */
    emergencyCall?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description presence of a fire sprinkler system
     * @enum {string}
     */
    fireSprinkler?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description presence of a fire alarm system
     * @enum {string}
     */
    fireAlarm?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description presence of an intruder alarm system
     * @enum {string}
     */
    intruderAlarm?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description high security entrance door
     * @enum {string}
     */
    reinforcedDoor?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description built-in safe is available in the property
     * @enum {string}
     */
    safe?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  };
  /**
   * @description a building is ready for wheelchair use, when it is barrierFree and the doors/passages are at least 90 cm wide
   * @enum {string}
   */
  wheelchairUse?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  /**
   * @description building has a wine cellar
   * @enum {string}
   */
  wineCellar?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  residential?: {
    /**
     * @description assisted living is offered
     * @enum {string}
     */
    assistedLiving?: 'YES' | 'NO' | 'PART' | 'NOT_APPLICABLE';
    /**
     * @description presence of a chimney, indoor fireplace
     * @enum {string}
     */
    chimney?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description use as shared living (app., house) is possible
     * @enum {string}
     */
    flatSharePossible?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description hammam present, room full of steam, humid interior, generally tiled walls
     * @enum {string}
     */
    hammam?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description Is there a house cleaning service provided
     * @enum {string}
     */
    houseCleaningService?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description presence of a jacuzzi, hot tub
     * @enum {string}
     */
    jacuzzi?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description an outdoor room or gallery without windows, that is part of a house. In contrast to balcony, the loggia is surrounded by house walls on 2-3 sides.
     * @enum {string}
     */
    loggia?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description sauna present, room full of steam
     * @enum {string}
     */
    sauna?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description info about a swimmingPool belonging to the property
     * @enum {string}
     */
    swimmingPool?:
      | 'YES'
      | 'NO'
      | 'INSIDE'
      | 'OUTSIDE'
      | 'INSIDE_AND_OUTSIDE'
      | 'NOT_APPLICABLE';
    /**
     * @description info about a tennisField belonging to the property
     * @enum {string}
     */
    tennisField?: 'YES' | 'NO' | 'NOT_APPLICABLE' | 'PRIVATE' | 'SHARED';
    /**
     * @description What TV connection does the property have?
     * @enum {string}
     */
    tv?: 'SAT' | 'CABLE' | 'OTHER';
    /**
     * @description house has a veranda/ wintergarden
     * @enum {string}
     */
    veranda?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description wash or dryroom present
     * @enum {string}
     */
    laundryRoom?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    countrySpecific?: {
      fr?: {
        /** @enum {string} */
        evacuation?: 'ALL_SEWER' | 'SEPTIC_TANK';
      };
    };
  };
  commercial?: {
    /**
     * @description The building has a ramp for a truck. This ramp may be separated from the access for regular cars.
     * @enum {string}
     */
    accessibleByTrucks?:
      | 'YES'
      | 'NO'
      | 'NOT_APPLICABLE'
      | 'SEPARATED_TRUCK_ACCESS';
    /**
     * @description presence of an auditorium room
     * @enum {string}
     */
    auditorium?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description presence of a bar primarily for gastronomy and hotel
     * @enum {string}
     */
    bar?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description building has an aeration and ventilation system, that removes the used and “dirty” indoor air and replaces it with new, fresh, and oxygen-rich air.
     * @enum {string}
     */
    buildingVentilation?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description cafeteria available
     * @enum {string}
     */
    cafeteria?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description property has a cold storage room
     * @enum {string}
     */
    coldStore?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description company restaurant available
     * @example YES
     * @enum {string}
     */
    companyRestaurant?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description A dropped ceiling is a secondary ceiling, hung below the main (structural) ceiling. It may also be referred to as a drop ceiling, T-bar ceiling, false ceiling, suspended ceiling, grid ceiling, drop in ceiling, drop out ceiling, or ceiling tiles
     * @enum {string}
     */
    droppedCeiling?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description An engine-generator or portable generator is the combination of an electrical generator and an engine (prime mover) mounted together to form a single piece of equipment.
     * @enum {string}
     */
    engineGenerator?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    exhaustHood?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description division of the rooms can be changed, by changing the usage or by removing walls
     * @enum {string}
     */
    flexibleRoomLayout?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description terrace can be heated
     * @enum {string}
     */
    heatedTerrace?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description presence of a machinery used for lifting and loading people (e.g.wheelchairs) or goods (cars) in a vertical form.
     * @enum {string}
     */
    liftingPlatform?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @description Number of storage cells in a warehouse */
    numberOfStorageCells?: number;
    /**
     * @description presence of an overhead crane
     * @enum {string}
     */
    overheadCrane?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @description Number of restaurant seats inside */
    restaurantSeats?: number;
    /** @description Number of restaurant seats outside */
    restaurantSeatsOutside?: number;
    /**
     * @description building has a tea-kitchen
     * @enum {string}
     */
    teaKitchen?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description presence of an area for maneuvering of trucks
     * @enum {string}
     */
    truckManeuveringArea?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    verticalSlidingDoor?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    wallSiding?: 'YES' | 'NO' | 'NOT_APPLICABLE' | 'DOUBLE' | 'DECORATIVE';
    countrySpecific?: {
      fr?: {
        /** @enum {string} */
        licenseType?:
          | 'PETITE_LICENCE_RESTAURANT'
          | 'LICENCE_RESTAURANT'
          | 'LICENCE_III'
          | 'LICENCE_IV';
      };
    };
  };
  parking?: {
    /**
     * @description charging station for electric cars
     * @enum {string}
     */
    chargingStation?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    bikeParking?: 'YES' | 'NO' | 'NOT_APPLICABLE';
  };
  plot?: {
    /** @description what the plot can be used for */
    usageFor?: {
      /** @enum {string} */
      futureDevelopmentLand?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      twinhouse?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      singleFamilyHouse?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      terraceHouse?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      apartmentBuilding?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      orchard?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      farmland?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      parkingSpace?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      garage?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      noDevelopment?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    };
    /** @description Basic Infrastructure on site */
    developmentInfrastructure?: {
      /** @enum {string} */
      districtHeating?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      electric?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      gas?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      telco?: 'YES' | 'NO' | 'NOT_APPLICABLE';
      /** @enum {string} */
      water?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    };
    /**
     * @description plot is shortTerm constructible
     * @enum {string}
     */
    shortTermConstructible?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description plot is brownfield. That is a site or industrial wasteland whose expansion, redevelopment or reuse may be complicated (presence of a hazardous substance?) Plot may be built on
     * @enum {string}
     */
    brownfield?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description permission to build
     * @enum {string}
     */
    buildingPermission?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description demolition is suggested - when there is an old building on the plot
     * @enum {string}
     */
    demolitionSuggested?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @enum {string} */
    fencedPlot?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /**
     * @description The plot is a terraced areas set, such as mediterranean Restanques or other common typical areas.
     * @example true
     */
    isTerracedArea?: boolean;
    /**
     * @description plot tilt or inclination measured as distance covered vertically divided by horizontally => measurement in % such as: - NONE means no extra earthwork is needed for new construction - MINOR if less than 6% - SIGNIFICANT if less than 12% - STEEP if more than 12% Note that terraced areas should take terraces tilt into account
     * @enum {string}
     */
    tilt?: 'NONE' | 'MINOR' | 'SIGNIFICANT' | 'STEEP';
    countrySpecific?: {
      de?: {
        /**
         * @description German Government Rules for Building Standards
         * @enum {string}
         */
        buildingRules?:
          | 'NEIGHBORHOOD_34'
          | 'EXTERNALAREA_35'
          | 'B_PLAN'
          | 'NO_BUILDINGAREA'
          | 'DEVELOPMENTAREA'
          | 'BUILDINGAREA_WITHOUT_PLAN'
          | 'COUNTRYSPECIFIC';
        /**
         * @description German Government Rules for Development;
         * @enum {string}
         */
        siteDevelopmentState?:
          | 'UNDEVELOPED'
          | 'PARTLY_DEVELOPED'
          | 'FULLY_DEVELOPED'
          | 'NO_INFORMATION';
      };
    };
  };
}