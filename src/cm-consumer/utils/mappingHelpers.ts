import { Classified, Location, VisibilityStatus } from "@shared/models/classified/1.0.0/classified";
import { DistributionType, Portal, Features, KitchenEquipment, Validation, ProjectType, BuildState } from '../models/classifiedEnums';

//https://avivgroup.atlassian.net/wiki/spaces/ATSS/pages/300812851/Search+index+model
export const mapPrice = (
    data: Classified
): number | null => {

    const portals = data?.visibility?.requests;
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
    buy: Classified['data']['prices']['buy']): { amount?: number } => compulsoryAuction?.minimumBid ?? getBuyAuctionPrice(buyAuction, buy)

export const mapFeatures = (
    classified: Classified
): string[] => {
    const { data, media, specifics } = classified;
    const {
        outside,
        streetParking,
        carport,
        garage,
        doubleGarage,
        duplex,
        garageArea,
        parkingArea,
        carPark,
        underground,
    } = { ...data.structure?.parkingLots }
    const { garden: { part = null, private: privateGarden = null, shared = null } = {}, wheelchairUse } = {
        ...data.features,
    }
    const { numberOfBalconies, numberOfTerraces } = { ...data.structure?.rooms }
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
    const { iwtStellplatzAnzahl } = { ...specifics?.de }

    const features: string[] = []

    if (
        kitchenEquipment === KitchenEquipment.FULLY_EQUIPPED ||
        kitchenEquipment === KitchenEquipment.STORAGE ||
        builtIn === true
    ) {
        features.push(Features.KITCHEN_FULLY_EQUIPPED)
    }
    if (part || privateGarden || shared) features.push(Features.GARDEN)
    if (bathWindow === Validation.YES) features.push(Features.BATHROOM_WINDOW)
    if (
        outside > 0 ||
        streetParking > 0 ||
        carport > 0 ||
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
    if (petsAllowed === Validation.YES) features.push(Features.PETS_ALLOWED)
    if (wheelchairUse === Validation.YES || barrierFree === Validation.YES) features.push(Features.REDUCE_MOBILITY_ACCESS)
    if (!(isRented === true || isImmediatelyAvailable === false)) features.push(Features.VACANT)
    if (bathtub === Validation.YES) features.push(Features.BATHTUB)
    if (cellar === Validation.YES || cellar === Validation.PART) features.push(Features.CELLAR)
    if (elevator?.person === Validation.YES || elevator?.freight === Validation.YES) features.push(Features.ELEVATOR)
    if (
        data.prices?.brokerageFee?.hasFee === Validation.NO ||
        data.prices?.brokerageFee?.hasFee === Validation.NOT_APPLICABLE
    ) {
        features.push(Features.COMMISSION_FREE)
    }
    if (media === undefined || media.length === 0) features.push(Features.NO_MEDIA)

    return features
}

export const mapProjectTypes = (
    classified: Classified
): string[] => {
    const { data, metadata } = classified;


    const { residential: { flatSharePossible = null } = {} } = {
        ...data.features,
    }
    const { rent: { isShortTimeRental = null } = {}, isForInvestment } = { ...data.management }
    const projectTypes: string[] = []

    if (metadata?.projectId || metadata?.externalProjectId) projectTypes.push(ProjectType.NEW_BUILD)
    if (isForInvestment) projectTypes.push(ProjectType.INVESTMENT)
    if (isShortTimeRental) projectTypes.push(ProjectType.SHORT_TIME_RENTAL)
    if (data.conditions?.buildState === BuildState.PROJECTED) projectTypes.push(ProjectType.PROJECTED)
    if (
        (data.estateSubType && data.estateSubType[data.estateType.toLocaleLowerCase()] === 'FLATSHARING_ROOM') ||
        flatSharePossible === Validation.YES
    ) {
        projectTypes.push(ProjectType.FLATSHARING)
    }
    if (projectTypes.length === 0) {
        if (data.distributionType === DistributionType.RENT) {
            projectTypes.push(ProjectType.STOCK)
        } else {
            projectTypes.push(ProjectType.RESALE)
        }
    }

    return projectTypes
}

export const mapEnergyCertificateClass = (
    classified: Classified
): string | undefined => {
    const certificates = [
        classified.data.energy?.countrySpecific?.de?.energyCertificates?.[0]?.efficiencyClass,
        classified.data.energy?.countrySpecific?.fr?.energyCertificate?.efficiencyClass,
        classified.data.energy?.countrySpecific?.at?.energyCertificates?.[0]?.overallEnergyEfficiencyFactorClass,
    ]

    const definedCertificates = certificates.filter((cert) => cert !== undefined)

    // if (definedCertificates.length > 1) {
    //     logger.warn('[mapIndexClassifiedDocument] Classified energy certificate is in multiple country specific.', {
    //         classifiedId,
    //         energy: JSON.stringify(energy),
    //     })
    // }

    return definedCertificates[0]
}


