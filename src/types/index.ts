export interface MEP {
  id: number;
  mep_id: string;
  name: string;
  country: string;
  national_party: string;
  political_group: string;
  political_group_short: string;
  photo_url: string;
  profile_url: string;
  status: string;
  last_updated: string;
}

export interface Stats {
  totalMeps: number;
  byGroup: { name: string; count: number }[];
  byCountry: { name: string; count: number }[];
}

export interface PageInfo {
  totalRows: number;
  page: number;
  pageSize: number;
  isFirstPage: boolean;
  isLastPage: boolean;
}
