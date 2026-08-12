import { Classified } from "@shared/models/classified/1.0.0/classified";
import { KitchenEquipment, Features, Validation, SwimmingPool ,MandateType} from "cm-consumer/models/classifiedEnums";

export const mapFeatures = (
    classified: Classified
): string[] => {
    const { data, media, specifics } = classified;
    const {
      box = 0,
      inside = 0,
      outside = 0,
      streetParking = 0,
      carport = 0,
      hasGarage = false,
      garage = 0,
      doubleGarage = 0,
      duplex = 0,
      garageArea = 0,
      parkingArea = 0,
      carPark = 0,
      underground = 0,
    } = { ...data.structure?.parkingLots }
    const {
      garden: { part = null, private: privateGarden = null, shared = null } = {},
      wheelchairUse,
      residential: { swimmingPool = null, assistedLiving = null } = {},
      aircondition
    } = {
      ...data.features,
    }
    const { numberOfBalconies = 0, numberOfTerraces = 0 } = { ...data.structure?.rooms }
    const { isImmediatelyAvailable, isRented, rent: { petsAllowed = null } = {} } = { ...data.management }
    const {
      bath: { window: bathWindow = null, bathtub = null } = {},
      kitchen: { kitchenEquipment = null, kitchenType: { builtIn = null } = {} } = {},
      cellar,
      elevator,
      barrierFree,
    } = {
      ...data.structure?.building,
    }
    const { iwtStellplatzAnzahl = 0 } = { ...specifics?.de }
  
      const {
    cellar: cellarFromExtraction,
    flatSharePossible,
    garage: garageFromExtraction,
    garden,
    houseboat
    } = { ...specifics?.extraction?.features }

    const features: string[] = []
  
    if (
      kitchenEquipment === KitchenEquipment.FULLY_EQUIPPED ||
      kitchenEquipment === KitchenEquipment.STORAGE ||
      builtIn === true
    ) {
      features.push(Features.KITCHEN_FULLY_EQUIPPED)
    }
    if (garden || part || privateGarden || shared) features.push(Features.GARDEN)
    if (bathWindow === Validation.YES) features.push(Features.BATHROOM_WINDOW)
    if (
      garageFromExtraction ||
      box > 0 ||
      inside > 0 ||
      outside > 0 ||
      streetParking > 0 ||
      carport > 0 ||
      hasGarage ||
      garage > 0 ||
      doubleGarage > 0 ||
      duplex > 0 ||
      garageArea > 0 ||
      parkingArea > 0 ||
      carPark > 0 ||
      underground > 0 ||
      iwtStellplatzAnzahl > 0
      // eslint-disable-next-line prettier/prettier
    ) features.push(Features.PARKING_GARAGE)
    if (numberOfBalconies > 0 || numberOfTerraces > 0) features.push(Features.BALCONY_TERRACE)
    if (
      swimmingPool === SwimmingPool.YES ||
      swimmingPool === SwimmingPool.OUTSIDE ||
      swimmingPool === SwimmingPool.INSIDE_AND_OUTSIDE ||
      swimmingPool === SwimmingPool.INSIDE
      // eslint-disable-next-line prettier/prettier
    ) features.push(Features.SWIMMING_POOL)
    if (petsAllowed === Validation.YES) features.push(Features.PETS_ALLOWED)
    if (wheelchairUse === Validation.YES || barrierFree === Validation.YES) features.push(Features.REDUCE_MOBILITY_ACCESS)
    if (!(isRented === true || isImmediatelyAvailable === false)) features.push(Features.VACANT)
    if (bathtub === Validation.YES) features.push(Features.BATHTUB)
    if (cellarFromExtraction || cellar === Validation.YES || cellar === Validation.PART) features.push(Features.CELLAR)
    if (elevator?.person === Validation.YES || elevator?.freight === Validation.YES) features.push(Features.ELEVATOR)
    if (
      data.prices?.brokerageFee?.hasFee === Validation.NO ||
      data.prices?.brokerageFee?.hasFee === Validation.NOT_APPLICABLE
    ) {
      features.push(Features.COMMISSION_FREE)
    }
    if (media === undefined || media.length === 0) features.push(Features.NO_MEDIA)
      if (aircondition === Validation.YES || aircondition === Validation.PART) features.push(Features.AIR_CONDITION)
      if (assistedLiving === Validation.YES || assistedLiving === Validation.PART) features.push(Features.ASSISTED_LIVING)
      if (houseboat) features.push(Features.HOUSEBOAT)
      if (flatSharePossible) features.push(Features.FLATSHARE_POSSIBLE)
  
    return features
  }
  