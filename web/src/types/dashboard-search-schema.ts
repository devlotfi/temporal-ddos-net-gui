import { z } from "zod";
import { Constants } from "../constants";

export const dashboardSearchSchema = z.object({
  model: z.enum(Constants.MODEL_OPTIONS),
  day: z.enum(Constants.DAY_OPTIONS),
});
