export type SportKey =
  | "soccer" | "basketball" | "baseball" | "tennis" | "bjj" | "running"
  | "volleyball" | "swimming" | "football" | "golf" | "boxing" | "track";

export const SPORTS: Record<SportKey, string> = {
  soccer: "Soccer",
  basketball: "Basketball",
  baseball: "Baseball",
  tennis: "Tennis",
  bjj: "Brazilian Jiu-Jitsu",
  running: "Running",
  volleyball: "Volleyball",
  swimming: "Swimming",
  football: "American Football",
  golf: "Golf",
  boxing: "Boxing",
  track: "Track & Field",
};
