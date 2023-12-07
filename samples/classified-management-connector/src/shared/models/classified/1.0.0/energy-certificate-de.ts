export interface EnergyCertificateDe {
    nameOfCertificate?: string;
  
    certificateType:
      | 'ENEV2008'
      | 'ENEV2014'
      | 'NOT_AVAILABLE'
      | 'NOT_NECESSARY'
      | 'AT_VISIT';
  
    certificateBasedOn?: 'NEED' | 'CONSUMPTION';
  
    isResidentialBuilding?: boolean;
  
    primaryEnergySource?:
      | 'NO_INFORMATION'
      | 'SOLAR'
      | 'WIND'
      | 'COAL'
      | 'GAS'
      | 'OIL'
      | 'WOOD'
      | 'DISTRICT_HEATING'
      | 'ELECTRICITY';
  
    efficiencyClass?: 'A_PLUS' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  
    releaseDate?: string;
  
    validUntil?: string;
  
    yearOfConstructionBuilding?: number;
  
    yearOfConstructionHeating?: number;
  
    overallEnergyNeed?: number;
  
    primaryEnergyNeed?: number;
  
    electricityNeed?: number;
  
    heatingNeed?: number;
  
    overallEnergyConsumption?: number;
  
    primaryEnergyConsumption?: number;
  
    isWaterHeatingIncluded?: boolean;
  
    electricityConsumption?: number;
  
    heatingConsumption?: number;
  
    energyConsumptionIndicator?: number;
  
    iwtLegacyPrimaerEnergieTraeger?: string;
  }