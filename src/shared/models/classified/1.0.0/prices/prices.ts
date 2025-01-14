import { MultiLingualText } from '../classified';

export interface PriceCommon {
    /**
     * @description amount of the select priceType
     * @example 950
     */
    amount?: number;
    /**
     * @description the vat value in currency
     * @example 1000
     */
    vatValue?: number;
    /**
     * @description the vat value in percent
     * @example 19.6
     */
    vatPercent?: number;
    /** @description vat is included in the price */
    isVatIncluded?: boolean;
    priceInformation?: PriceInformation;
  }
  

export interface Prices {
  currency?: string;
  buy?: {
    /** @description the purchase price of the property */
    price?: PriceCommon;
    /**
     * @description the property can also be purchased as rental purchase
     * @example true
     */
    isLeaseBuyCombi?: boolean;
    /** @description A building or plot is sold to a cheaper price, but the buyer will not be the owner, but the leaseholder. If a property is leasehold, it is allowed to be used in return for payment (leasehold rent) according to the terms of a lease. de: Erbpacht/Erbbaurecht */
    leasehold?: {
      /**
       * @description amount of the leasehold rent
       * @example 120
       */
      amount: number;
      /**
       * @description when does the leaseholdRent have to be paid, per month or per year
       * @example YEAR
       * @enum {string}
       */
      priceTimeUnit: 'MONTH' | 'YEAR';
      /**
       * @description the leasehold duration in years. Usually a leasehold is 50-99 years. After that time, the leasehold often can be extended.
       * @example 99
       */
      duration?: number;
      /**
       * Format: date
       * @description date when the leasehold ends.
       * @example 2050-03-15
       */
      endDate?: string;
    };
    /** @description includes general maintenance costs, security, cleaning, administration, insurances, etc. for the building. de: Hausgeld */
    operatingCosts?: PriceCommon &
      Accounting & {
        /**
         * @description time unit for the price
         * @example DAY
         * @enum {string}
         */
        priceTimeUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
      };
    /** @description the real rental income of the latest period */
    rentalIncome?: PriceCommon & {
      /**
       * @description rental income period
       * @example YEAR
       * @enum {string}
       */
      priceTimeUnit?: 'MONTH' | 'YEAR';
    };
    /** @description expected rental income in future periods */
    rentalIncomeExpect?: PriceCommon & {
      /**
       * @description rental income period
       * @example YEAR
       * @enum {string}
       */
      priceTimeUnit?: 'MONTH' | 'YEAR';
    };
    parkingPrice?: PriceCommon & {
      isOperatingCostsIncluded?: boolean;
      /**
       * @description if the property has an additional garage/parking space then you can specify the parking style in details here. A parking lot can only be described by one (the most appropriate) item, not by several. Descriptions for the enums above: - OUTSIDE: a parking space that is outside,
       *   not in a garage
       * - STREET_PARKING: a parking space along the street - CARPORT: a shelter for vehicles that is open-sided
       *   and usually attached to a house
       * - GARAGE: a building for parking one vehicle usually
       *   with a vertical rolling door
       * - DOUBLE_GARAGE: like a garage but for two vehicles - DUPLEX: double parking on one parking space with a
       *   parking lift
       * - GARAGE_AREA: a single garage in an area with
       *   several garages only, no houses attached
       * - PARKING_AREA: a single parking lot in a confined
       *   area full of parking spaces
       * - CAR_PARK: a single parking space in an usually
       *   multistorey car park building
       * - UNDERGROUND: a single parking space in an
       *   underground garage (car park mainly below earth)
       * - BOAT_DOCK: parking for a boat (a berth)
       * @example GARAGE
       * @enum {string}
       */
      parkingStyle?:
        | 'OUTSIDE'
        | 'STREET_PARKING'
        | 'CARPORT'
        | 'GARAGE'
        | 'DOUBLE_GARAGE'
        | 'DUPLEX'
        | 'GARAGE_AREA'
        | 'PARKING_AREA'
        | 'CAR_PARK'
        | 'UNDERGROUND'
        | 'BOAT_DOCK';
    };
    /** @description Price per space measure unit (meter, foot, hectar) which is defined at spaces.spaceMeasureUnit. If spaces.spaceMeasureUnit is empty, SQUARE_METER is used as default. */
    pricePerSqUnit?: PriceCommon;
    /**
     * @description for the calculation of the return. calculation: purchase price divided by annual rental income
     * @example 12.5
     */
    yieldFactor?: number;
    countrySpecific?: {
      fr?: {
        /** @description Reduced notary fees ? */
        isReducedNotaryFees?: boolean;
        /** @enum {string} */
        notaryFeesFor?: 'BUYER' | 'SELLER' | 'SHARED';
        /** @description If it is a life annuity sell (Viager), the monthly amount to pay */
        lifeAnnuity?: PriceCommon;
      };
      at?: {
        operatingCostsNet?: {
          /** @description operating costs excl. vat (as in the operating costs catalog); de: BetriebskostenNetto exkl. Ust (lt.BK-Katalog) */
          amount?: number;
          priceInformation?: PriceInformation;
        };
        heatingCostsNet?: {
          /** @description heatingCosts excl. vat (if 0, no heatingCosts are included in totalRent) de: HeizkostenNetto; Heizkosten exkl. USt (wenn 0, dann keine HK in Warmmiete enthalten) */
          amount?: number;
          priceInformation?: PriceInformation;
        };
        miscCostsNet?: {
          /** @description overallLoadGross minus rentNet, operatingCostsNet, heatingCostsNet, overallLoadVat; de: SonstigeKostenNetto; MonatlichKostenBrutto abzgl, BetriebskostenNetto, HeizkostenNetto und MonatlicheKostenUst */
          amount?: number;
          priceInformation?: PriceInformation;
        };
        /** @description sum of the monthly vat costs de: MonatlicheKostenUSt; summe der monatlichen MwSt Kosten */
        vatCostsPerMonth?: number;
        costsPerMonthGross?: {
          /** @description sum of the monthly costs gross (incl. vat, additionalCosts, heatingCosts, other costs) de: MonatlicheKostenBrutto; Summe monatlicher Kosten (inkl.Ust, BK, HK, Sonstige) */
          amount?: number;
          priceInformation?: PriceInformation;
        };
      };
    };
  };
  /** @description rent price information */
  rent?: {
    /** @description base rent without any operating costs, water, power, etc. */
    baseRent?: PriceCommon;
    /** @description includes base rent and operating costs */
    totalRent?: PriceCommon;
    /** @description lease is very similar to rent but not the same. As a tenant of lease you have more rights: you may not only use the property, but you may also generate a profit out of it. typical examples: when you lease agriculture ground or a gastronomy property. */
    lease?: PriceCommon;
    /** @description includes general maintenance costs, insurances, etc. for the building. And sometimes even water and heating costs, but this depends on the contract with the landlord. */
    operatingCosts?: PriceCommon & Accounting;
    /** @description costs for the heating */
    heatingCosts?: PriceCommon & Accounting;
    /**
     * @description are the costs for heating already included in the operating costs?
     * @example true
     */
    isHeatingIncludedInOC?: boolean;
    /**
     * @description are the costs for heating already included in the total rent?
     * @example true
     */
    isHeatingIncludedInTR?: boolean;
    /** @description Price per space measure unit (meter, foot, hectar) which is defined at spaces.spaceMeasureUnit. If spaces.spaceMeasureUnit is empty, SQUARE_METER is used as default. pricePerSqUnit is usually based on base rent. */
    pricePerSqUnit?: PriceCommon;
    /** @description Price per year and price per space measure unit (meter, foot, hectar) which is defined at spaces.spaceMeasureUnit. If spaces.spaceMeasureUnit is empty, SQUARE_METER is used as default. pricePerSqUnit is usually based on base rent. */
    pricePerSqUnitPerYear?: PriceCommon;
    /**
     * @description time unit for the rent prices. Unless specified differently, Default is MONTH!
     * @example MONTH
     * @enum {string}
     */
    priceTimeUnit?: 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
    /**
     * @description is the parking space (if available) included in the rent
     * @example true
     */
    isParkingPriceIncluded?: boolean;
    parkingRent?: PriceCommon & {
      /**
       * @description if the property has an additional garage/parking space then you can specify the parking style in details here. A parking lot can only be described by one (the most appropriate) item, not by several. Descriptions for the enums above: - OUTSIDE: a parking space that is outside,
       *   not in a garage
       * - STREET_PARKING: a parking space along the street - CARPORT: a shelter for vehicles that is open-sided
       *   and usually attached to a house
       * - GARAGE: a building for parking one vehicle usually
       *   with a vertical rolling door
       * - DOUBLE_GARAGE: like a garage but for two vehicles - DUPLEX: double parking on one parking space with a
       *   parking lift
       * - GARAGE_AREA: a single garage in an area with
       *   several garages only, no houses attached
       * - PARKING_AREA: a single parking lot in a confined
       *   area full of parking spaces
       * - CAR_PARK: a single parking space in an usually
       *   multistorey car park building
       * - UNDERGROUND: a single parking space in an
       *   underground garage (car park mainly below earth)
       * - BOAT_DOCK: parking for a boat (a berth)
       * @example GARAGE
       * @enum {string}
       */
      parkingStyle?:
        | 'OUTSIDE'
        | 'STREET_PARKING'
        | 'CARPORT'
        | 'GARAGE'
        | 'DOUBLE_GARAGE'
        | 'DUPLEX'
        | 'GARAGE_AREA'
        | 'PARKING_AREA'
        | 'CAR_PARK'
        | 'UNDERGROUND'
        | 'BOAT_DOCK';
    };
    /** @description an amount of money you pay the landlord as a returnable security deposit. */
    depositNote?: MultiLingualText;
    countrySpecific?: {
      fr?: {
        /** @description amount to pay to the previous tenant the be allowed to rent the property (shop/office). */
        leaseRight?: PriceCommon;
        /** @description amount to pay to the property owner to be allowed to rent the property (shop/office) */
        accessPrice?: PriceCommon;
        /**
         * @description When the rent price exceeds the regulated rent price. The amount above is mandatory.
         * @example 225.6
         */
        overRegulatedRent?: number;
      };
      at?: {
        heatingCostsNet?: {
          /** @description heatingCosts excl. vat (if 0, no heatingCosts are included in totalRent); de: Heizkosten exkl. USt (wenn 0, dann keine HK in Warmmiete enthalten) */
          amount?: number;
          priceInformation?: PriceInformation;
        };
        miscCostsNet?: {
          /** @description overallLoadGross minus rentNet, operatingCostsNet, heatingCostsNet, overallLoadVat de: SonstigeKostenNetto; GesamtbelastungBrutto abzgl. SummeMieteNetto, BetriebskostenNetto, HeizkostenNetto und GesamtbelastungUSt */
          amount?: number;
          priceInformation?: PriceInformation;
        };
        operatingCostsNet?: {
          /** @description operating costs excl. vat (as in the operating costs catalog); de: BetriebskostenNetto; Betriebskosten exkl. Ust (lt. BK-Katalog) */
          amount?: number;
          priceInformation?: PriceInformation;
        };
        overallLoadGross?: {
          /** @description overall rent / all-inclusive rent (incl. vat, additionalCosts, heatingCosts, other costs); de: GesamtbelastungBrutto; Gesamtbelastung (inkl. Ust, BK, HK, sonstige) / Pauschalmiete */
          amount?: number;
          priceInformation?: PriceInformation;
        };
        /** @description overall load of the vat de: GesamtbelastungUSt; summe mwst */
        overallLoadVat?: number;
        overallRentGross?: {
          /** @description overallLoadGross minus heatingCostsGross de: GesamtMieteBrutto: (GesamtbelastungBrutto minus HeizkostenBrutto) */
          amount?: number;
          priceInformation?: PriceInformation;
        };
        rentNet?: {
          /** @description rent excl. vat (excl. operatingCosts,heatingsCosts) incl. eg. rent for furniture; de: SummeMieteNetto / HauptmietzinsNetto; Miete exkl. MwSt (exkl.BK, HK) inkl. z.B.Möbelmiete */
          amount?: number;
          priceInformation?: PriceInformation;
        };
      };
    };
  };
  /** @description compulsory/foreclosure auction price information. */
  compulsoryAuction?: {
    /** @description The final / highest auction price. de: Auktionserlös */
    auctionProceeds?: PriceCommon;
    /** @description Minimum deposit that has to be made at the auction date. */
    biddingGuarantee?: PriceCommon;
    /** @description the average market value of the property */
    marketValue: PriceCommon;
    /** @description the minimum bid value de: Mindestgebot */
    minimumBid?: PriceCommon;
  };
  /** @description Bid process. The purchase is voluntarily. The minimum price is set by the offerer. Potential buyers make an offer within a particular period. The offerer decides, if he accepts the highest bid, it is not binding as in a typical auction. */
  buyAuction?: {
    minPrice?: {
      /** @description this is the lower price limit. the buy price may be higher, but it must by no means be lower. */
      amount?: number;
      /**
       * @description the vat value in currency
       * @example 1000
       */
      vatValue?: number;
      /**
       * @description the vat value in percent
       * @example 19.6
       */
      vatPercent?: number;
      /** @description vat is included in the price */
      isVatIncluded?: boolean;
    };
    /**
     * Format: date
     * @description start date when offers can be made. must be an ISO 8601 formatted string
     * @example 2020-03-15
     */
    startOfferPhase?: string;
    /**
     * Format: date
     * @description end date until offers are accepted; must be an ISO 8601 formatted string
     * @example 2020-03-15
     */
    endOfferPhase?: string;
  };
  /** @description Real estate agency or broker Fee detailed information commission for the real estate agent; de: Maklerprovision fr: Frais d'agence */
  brokerageFee?: PriceCommon & {
    /** @description is the fee included in the buy price */
    isFeeIncluded?: boolean;
    /**
     * @description who pays the fee after a mediation (sale or rental) of a property by a real estate agent or broker. The buyer/ new tenant or the seller/ landlord of the property?
     * @example BUYER_OR_TENANT
     * @enum {string}
     */
    feeFor?: 'BUYER_OR_TENANT' | 'SELLER_OR_LANDLORD' | 'SHARED';
    /**
     * @description The value of the agency fee in percentage
     * @example 4.5
     */
    feePercentage?: number;
    /**
     * @description will a brokerage fee be charged?
     * @example YES
     * @enum {string}
     */
    hasFee?: 'YES' | 'NO' | 'NOT_APPLICABLE';
    /** @description textarea for additional agency fee or brokerage fee information. It can be transmitted in several languages. */
    feeNote?: MultiLingualText;
    countrySpecific?: {
      fr?: {
        /**
         * Format: url
         * @description URL of a document listing the fees of services provided by the real estate agency or broker. Mandatory information when applicable.
         * @example http://www.example.org
         */
        feeScheduleLink?: string;
        /**
         * @description Fee amount of the inventory of the rented property
         * @example 120 euros
         */
        inventoryFee?: string;
      };
    };
  };
  /**
   * @description general setting for displaying the price on the portal/ website
   * @example true
   */
  showPrice?: boolean;
  /** @description textarea for further price information, taxes or fees. the information can be transmitted in several languages. The corresponding data element therefore is an object and contains data elements which contain the language abbreviation in ISO 639-1 as a name. */
  priceNote?: MultiLingualText;
  countrySpecific?: {
    fr?: {
      taxRegime?: string;
      /** @description Residential lease type. fr:Nature du bail résidentiel Loi 89, meblé ou Loi 48... */
      residentialLeaseType?: string;
      /**
       * @description fr: est-ce que le bien est éligible au prêt à taux zéro ?
       * @example true
       */
      isPTZeligible?: boolean;
      /**
       * @description In France and Belgium, the buyers or landlords can get tax reductions when they buy or rent a new built property. The tax reduction level depends on the geographic zone to which the property belongs.
       * @enum {string}
       */
      taxReductionZone?: 'A' | 'A_BIS' | 'B1' | 'B2' | 'C';
    };
  };
}

export interface Accounting {
  /**
   * @description How often the costs are paid and how: - FIXED: fixed amount paid each time unit - REAL_USAGE: amount calculated on real usage paid each time unit - ADJUSTMENT: fixed amount paid each time unit and regular
   *   (yearly?) adjustment based on real usage
   * @example ADJUSTMENT
   * @enum {string}
   */
  accounting?: 'FIXED' | 'REAL_USAGE' | 'ADJUSTMENT';
}

export type PriceInformation = 'PRICE_ON_DEMAND' | 'BASIS_FOR_NEGOTIATION' | 'BASE_ON_RANGE_PRICE';
