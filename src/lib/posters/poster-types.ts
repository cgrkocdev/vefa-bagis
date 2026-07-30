export type PosterOrientation = "LANDSCAPE" | "PORTRAIT";
export type PosterShare = { id: string; shareNumber: number; status: string; donorName: string | null };
export type PosterProject = {
  id: string;
  projectNumber: number;
  name: string;
  year: string;
  department: string;
  type: string;
  group: string;
  country: string;
  countryCode: string;
  partner: string;
  region: string;
  status: string;
  isVirtual: boolean;
  shareCapacity: number;
  shares: PosterShare[];
};
export type AssociationData = {
  id: string; name: string; shortName: string; logoDataUrl: string | null; logoAlt: string | null;
  phone: string | null; website: string | null; address: string | null; isActive: boolean; isDefault: boolean; sortOrder: number;
};
