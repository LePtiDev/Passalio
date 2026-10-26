export type TechnicianSeats = {
  readonly hasFreeSeat: (organizationId: string) => Promise<boolean>;
};
