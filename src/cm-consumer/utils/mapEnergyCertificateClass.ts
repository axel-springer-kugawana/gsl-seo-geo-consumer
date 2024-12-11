import { Classified } from "@shared/models/classified/1.0.0/classified";


export const mapEnergyCertificateClass = (
    classified: Classified
): string | undefined => {
    const certificates = [
        classified.data.energy?.countrySpecific?.de?.energyCertificates?.[0]?.efficiencyClass,
        classified.data.energy?.countrySpecific?.fr?.energyCertificate?.efficiencyClass,
        classified.data.energy?.countrySpecific?.at?.energyCertificates?.[0]?.overallEnergyEfficiencyFactorClass,
    ];

    const definedCertificates = certificates.filter((cert) => cert !== undefined);

    // if (definedCertificates.length > 1) {
    //     logger.warn('[mapIndexClassifiedDocument] Classified energy certificate is in multiple country specific.', {
    //         classifiedId,
    //         energy: JSON.stringify(energy),
    //     })
    // }
    return definedCertificates[0];
};
