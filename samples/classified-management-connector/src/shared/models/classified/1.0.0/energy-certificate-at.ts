export interface EnergyCertificateAt {
    nameOfCertificate?: string;
  
    heatingNeed?: number;
  
    heatingNeedClass?:
      | 'A_PLUS_PLUS'
      | 'A_PLUS'
      | 'A'
      | 'B'
      | 'C'
      | 'D'
      | 'E'
      | 'F'
      | 'G';
  
    overallEnergyEfficiencyFactor?: number;
  
    overallEnergyEfficiencyFactorClass?:
      | 'A_PLUS_PLUS'
      | 'A_PLUS'
      | 'A'
      | 'B'
      | 'C'
      | 'D'
      | 'E'
      | 'F'
      | 'G';
  }