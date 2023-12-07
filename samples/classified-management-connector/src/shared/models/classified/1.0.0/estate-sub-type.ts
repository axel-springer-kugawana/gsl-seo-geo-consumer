export interface EstateSubType {
    /**
     * @description subtypes of a house to describe the selected estate type in detail. descriptions for the enums above: - APARTMENT_HOUSE: a building containing multiple apartments
     *   with a common entrance and sometimes services
     * - BUNGALOW: a house that usually has only one storey, sometimes
     *   with an attic, with a flat or a low-pitched roof
     * - CASTLE:  a historical massive and imposing building
     *   usually fortified, built by the nobility, royalty or
     *   by military orders.
     * - MANOR_HOUSE:
     *   magnificent country house, often dating from the late middle
     *   ages, in which the landed gentry used to live.
     * - CHALET: a wooden house with a sloping roof and widely
     *   overhanging eaves, common in Switzerland and other Alpine
     *   regions in Europe.
     * - FARMHOUSE: a house attached to a farm, especially the main
     *   house in which the farmer lives.
     * - FINCA: spanish-style country house with a large garden in
     *   rural environment
     * - GARDEN_HOUSE: a small dwelling usually built of wood located
     *   in the garden of a large property or in garden allotments
     * - GITE: a furnished holiday home in France that is available
     *   for rent, especially in a rural environment.
     * - LIVING_AND_COMMERCIAL: a building that contains units for
     *   living and for commercial, eg apartments, shops, offices
     * - MOUNTAIN_HUT: a building located high in the mountains,
     *   usually accessible only by foot. When they are managed, they
     *   provide food and shelter to mountaineers
     * - MULTI_FAMILY_HOUSE: a single building that is set up to
     *   accommodate more than one family living separately.
     * - RESIDENTIAL_COMPLEX: a set of buildings containing multiple apartments
     *   often with common services, shared garden, pool, playground
     * - RUSTICO: originally a cottage or farm building traditionally
     *   built with granite, typical for Ticino in Switzerland
     * - SEMIDETACHED_HOUSE: a house that is joined to another similar
     *   house on one side by a shared wall
     * - SINGLE_FAMILY_HOUSE: a freestanding house, with one dwelling
     *   unit for a person, couple or a family, set alone on its own
     *   parcel of land
     * - SPECIAL_REAL_ESTATE: a special kind of property that can not
     *   be classified by another subtype, eg like a church
     * - TERRACE_HOUSE: row of similar houses joined together
     *   by their side walls; row houses
     *   de: Achtung! entspricht nicht einem Terrassenhaus im Deutschen!
     * - CORNER_TERRACE_HOUSE: is located at the corner or staggered
     *   in a row of terrace houses; one side wall is shared with
     *   another terrace house
     * - END_TERRACE_HOUSE: is located at the end of a row of terrace
     *   houses, one side wall is shared with another terrace house
     * - MID_TERRACE_HOUSE: is located in the middle of a row of
     *   terrace houses, both side walls are shared with another
     *   terrace house each.
     * - TOWN_HOUSE: a tall, narrow house generally having three or
     *   more floors, usually in a row of similar houses which are
     *   connected together, sometimes even by a common sidewall.
     * - VILLA: a prestigious house, that is very spacious and may
     *   include luxurious amenities such as a pool, etc.
     * @example SINGLE_FAMILY_HOUSE
     * @enum {string}
     */
    house?:
      | 'APARTMENT_HOUSE'
      | 'BUNGALOW'
      | 'CASTLE'
      | 'MANOR_HOUSE'
      | 'CHALET'
      | 'FARMHOUSE'
      | 'FINCA'
      | 'GARDEN_HOUSE'
      | 'GITE'
      | 'LIVING_AND_COMMERCIAL'
      | 'MULTI_FAMILY_HOUSE'
      | 'MOUNTAIN_HUT'
      | 'RESIDENTIAL_COMPLEX'
      | 'RUSTICO'
      | 'SEMIDETACHED_HOUSE'
      | 'SINGLE_FAMILY_HOUSE'
      | 'SPECIAL_REAL_ESTATE'
      | 'TERRACE_HOUSE'
      | 'CORNER_TERRACE_HOUSE'
      | 'END_TERRACE_HOUSE'
      | 'MID_TERRACE_HOUSE'
      | 'TOWN_HOUSE'
      | 'VILLA';
    /**
     * @description subtypes of an apartment to describe the selected estate type in detail. descriptions for the enums above: - MULTI_STOREY: apartment that spreads over two, three or more
     *   floors connected by an inner staircase, offered as
     *   one property. a maisonette;
     * - FLATSHARING_ROOM: single room within a flat or a house in the
     *   context of shared living
     * - LOFT: an industrial, warehouse, or commercial space converted
     *   to an apartment
     * - PENTHOUSE: an apartment on the highest floor of a building,
     *   that is usually equipped with high standard.
     *   Equivalent to the Swiss Attica.
     * - STUDIO: a small flat in which the normal rooms (living
     *   room, bedroom and kitchen) are combined into a single room
     * - TERRACE: an apartment with a terrace and often an
     *   adjoining garden
     * - UNFINISHED_ATTIC_SPACE: large attic floor that can be
     *   developed into an apartment
     * @example LOFT
     * @enum {string}
     */
    apartment?:
      | 'MULTI_STOREY'
      | 'FLATSHARING_ROOM'
      | 'LOFT'
      | 'PENTHOUSE'
      | 'STUDIO'
      | 'TERRACE'
      | 'UNFINISHED_ATTIC_SPACE';
    /**
     * @description subtypes of a plot to describe the selected estate type in detail. descriptions for the enums above: - LIVING: only residential buildings may be built on that plot - COMMERCIAL: only for commercial use - INDUSTRY: only for industrial use - AGRICULTURE_FORESTRY: a plot intended for farming or forestry - MIXED: a plot for mixed usage - LEISURE_FACILITY: for leisure activities such as sports,
     *   gardening, etc.
     * - COMMERCIAL_PARC: a plot in a commercial park or a commercial
     *   park itself
     * - SPECIAL_USE: a plot for a separate or special use - LAKESIDE_PROPERTY: a plot that adjoins a lake or the sea
     * @example COMMERCIAL
     * @enum {string}
     */
    plot?:
      | 'LIVING'
      | 'COMMERCIAL'
      | 'INDUSTRY'
      | 'AGRICULTURE_FORESTRY'
      | 'MIXED'
      | 'LEISURE_FACILITY'
      | 'COMMERCIAL_PARC'
      | 'SPECIAL_USE'
      | 'LAKESIDE_PROPERTY';
    /**
     * @description subtypes of an office property to describe the selected estate type in detail. descriptions for the enums above: - SINGLE_OFFICE: single office room - OFFICE_SPACE: an office for several workplaces, can consist
     *   of several rooms
     * - OFFICE_BUILDING: a building that contains different office
     *   units
     * - OFFICE_CENTRE: a larger building that contains different
     *   office units, can also be made up of several buildings
     * - OFFICE_STORAGE_BUILDING: combines an office building
     *   and a warehouse
     * - MEDICAL: medical practice sometimes already equipped with
     *   medical apparatus
     * - MEDICAL_FLOOR: more general a floor for a medical practice - MEDICAL_BUILDING: a building that contains different medical
     *   units; medical centre
     * - LIVING_AND_COMMERCIAL_BUILDING: a building that contains units
     *   for living and for commercial, eg apartments, shops, offices
     * - ATELIER: a workshop or studio, usually for artists or designer - COWORKING: an arrangement in which several workers from many
     *   different companies share an office space; typically you do
     *   not sit at the same desk every day and it is for short term
     * - SHARED_OFFICE: an arrangement in which several companies
     *   share an office space; typically you keep the same desk
     *   and it is for long term
     * - OPEN_SPACE: an open-plan office, without small rooms or
     *   cubicles, usually has long rows of desks with little or
     *   nothing dividing them.
     * @example SINGLE_OFFICE
     * @enum {string}
     */
    office?:
      | 'SINGLE_OFFICE'
      | 'OFFICE_SPACE'
      | 'OFFICE_BUILDING'
      | 'OFFICE_CENTRE'
      | 'OFFICE_STORAGE_BUILDING'
      | 'MEDICAL'
      | 'MEDICAL_FLOOR'
      | 'MEDICAL_BUILDING'
      | 'LIVING_AND_COMMERCIAL_BUILDING'
      | 'ATELIER'
      | 'COWORKING'
      | 'OPEN_SPACE'
      | 'SHARED_OFFICE';
    /**
     * @description subtypes of a trading related property to describe the selected estate type in detail. descriptions for the enums above: - STORE: shop or store for retail - SHOWROOM_SPACE: a room where merchandise is exhibited for
     *   sale or where samples are displayed
     * - SHOPPING_CENTRE: a building that contains several stores - KIOSK: a small building from which people can buy things such
     *   as sandwiches or newspapers usually through an open window or
     *   with a very small sellspace
     * - SALES_AREA: a sellspace within another store
     * @example STORE
     * @enum {string}
     */
    trading?:
      | 'STORE'
      | 'SHOWROOM_SPACE'
      | 'SHOPPING_CENTRE'
      | 'KIOSK'
      | 'SALES_AREA';
    /**
     * @description subtypes of a gastronomy and hotel related property to describe the selected estate type in detail. descriptions for the enums above: - CAFE_BAR_PUB: a property for a cafe, a bar, a pub or
     *   something similar
     * - RESTAURANT: a property for a restaurant - CLUB_DISCOTHEQUE: a property for club or a discotheque - HOTEL: a property for a hotel - APART_HOTEL: like a hotel, but instead of small rooms there
     *   are apartments or studios
     * - LEISURE: a property for leisure or entertainment with gastronomy
     * @example RESTAURANT
     * @enum {string}
     */
    gastronomyHotel?:
      | 'CAFE_BAR_PUB'
      | 'RESTAURANT'
      | 'CLUB_DISCOTHEQUE'
      | 'HOTEL'
      | 'APART_HOTEL'
      | 'LEISURE';
    /**
     * @description subtypes of a storage and production related property to describe the selected estate type in detail. descriptions for the enums above: - WAREHOUSE_HALL: a hall for industry and storage - LOGISTICS_CENTER: - PRODUCTION_HALL: an industrial hall where something is
     *   produced
     * - GARAGE_REPAIR: a repair shop or workshop - OUTDOOR_SPACE: an open space without a building or adjoining
     *   to a building
     * - MISC_STORAGE: a storage property that cannot be dedicated to
     *   one of the other subTypes
     * @example WAREHOUSE_HALL
     * @enum {string}
     */
    storageProduction?:
      | 'WAREHOUSE_HALL'
      | 'LOGISTICS_CENTER'
      | 'PRODUCTION_HALL'
      | 'GARAGE_REPAIR'
      | 'OUTDOOR_SPACE'
      | 'MISC_STORAGE';
    /**
     * @description subtypes of a agriculture and forest related property to describe the selected estate type in detail. descriptions for the enums above: - FARM_RANCH: land area with usually different buildings for
     *   farming and livestock
     * - AGRICULTURE_COMPANY: farm that runs agriculture as business - GARDENING: place where plants are tended and cultivated for
     *   trading or selling
     * - FORESTRY: management of forests, with planting, lumbering
     *   and caring for the wood
     * - WINERY: an establishment where wine is grown and made - HUNTING: a ground for hunting - FISHING: fishery and aquaculture - RIDING: riding stables; also includes a farm where horses are bred - MISC_AGRICULTURE: other properties regarding agriculture - ORCHARD: farm or plantation for fruits
     * @example GARDENING
     * @enum {string}
     */
    agricultureForestry?:
      | 'FARM_RANCH'
      | 'AGRICULTURE_COMPANY'
      | 'GARDENING'
      | 'FORESTRY'
      | 'WINERY'
      | 'HUNTING'
      | 'FISHING'
      | 'RIDING'
      | 'MISC_AGRICULTURE'
      | 'ORCHARD';
    /**
     * @description subtypes of a parking property to describe the selected estate type in detail. Descriptions for the enums above: - OUTSIDE: a parking space that is outside not in a garage - STREET_PARKING: a parking space along the street - CARPORT: a shelter for vehicles that is open-sided and
     *   usually attached to a house
     * - GARAGE: a building for parking one vehicle usually with a
     *   vertical rolling door
     * - DOUBLE_GARAGE: like a garage but for two vehicles - DUPLEX: double parking on one parking space with a
     *   parking lift
     * - GARAGE_AREA: an area with several garages only,
     *   no houses attached
     * - PARKING_AREA: a confined area full of parking spaces - CAR_PARK: a multistorey building for parking vehicles - UNDERGROUND_GARAGE: a car park that is mainly below earth - UNDERGROUND_PARKING_SPACE: a single parking space in an
     *   underground garage
     * - BOAT_DOCK: parking for a boat, a berth
     * @example GARAGE
     * @enum {string}
     */
    parking?:
      | 'OUTSIDE'
      | 'STREET_PARKING'
      | 'CARPORT'
      | 'GARAGE'
      | 'DOUBLE_GARAGE'
      | 'DUPLEX'
      | 'GARAGE_AREA'
      | 'PARKING_AREA'
      | 'CAR_PARK'
      | 'UNDERGROUND_GARAGE'
      | 'UNDERGROUND_PARKING_SPACE'
      | 'BOAT_DOCK';
    /**
     * @description subtypes for senior related property to describe the selected estate type in detail
     * @example ASSISTED_LIVING
     * @enum {string}
     */
    senior?: 'LIVING' | 'ASSISTED_LIVING' | 'MEDICAL_CARE';
    /**
     * @description subtypes of a real estate project to describe the initial selected estate type in detail
     * @example MULTI_FAMILY_HOUSE
     * @enum {string}
     */
    project?:
      | 'MULTI_FAMILY_HOUSE'
      | 'HOUSE_PARK'
      | 'SINGLE_MULTI_HOUSES'
      | 'MISCELLANEOUS';
  }