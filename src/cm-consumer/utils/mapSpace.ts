import { Classified } from "@shared/models/classified/1.0.0/classified";

export const mapSpace = (classified: Classified): number | undefined => {

    const spaces = classified.data.spaces;

    const possibleCommercialSpaces = [
        spaces?.commercial?.commercialSpace,
        spaces?.commercial?.managementSpace,
        spaces?.commercial?.officePartSpace,
        spaces?.commercial?.officeSpace,
        spaces?.commercial?.restaurantSpace,
        spaces?.commercial?.sellSpace,
        spaces?.commercial?.shopSpace,
        spaces?.commercial?.storageSpace,
    ];
    const sumPossibleComercialSpaces = possibleCommercialSpaces.reduce((acc, val) => acc + (val || 0), 0);

    return spaces?.overallSpace || spaces?.residential?.livingSpace || sumPossibleComercialSpaces || undefined;
};
