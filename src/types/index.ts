// Screen types for navigation
export type Screen =
  | "initial"
  | "photoCapture"
  | "photoConfirm"
  | "styleSelect"
  | "refUpload"
  | "generating"
  | "result"
  | "history"
  | "historyDetail";

export type Gender = "male" | "female";
export type FlowType = "ref" | "style";

export interface UserPhoto {
  uri: string;
  base64: string;
}

export interface RefImage {
  uri: string;
  base64?: string;
}

export interface HairColor {
  id: string;
  name: string;
  color: string | null;
}

export interface HairLengthFilter {
  id: string;
  label: string;
}

