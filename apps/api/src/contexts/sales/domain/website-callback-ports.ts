export type WebsiteCallbackError = "robot_suspected" | "too_many_requests";

export type Visitor = { readonly ipAddress: string | null };

export type AntiRobotCheck = {
  readonly isHuman: (token: string, visitor: Visitor) => Promise<boolean>;
};

export type VisitorRateLimit = {
  readonly isAllowed: (visitor: Visitor, at: Date) => Promise<boolean>;
};
