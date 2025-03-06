export interface SaleInfo {
  price: number;
  Grantee: string;
}

export interface PropertyData {
  [key: string]: {
    "square foot": string;
    "sale history": {
      [date: string]: SaleInfo;
    };
  };
}
