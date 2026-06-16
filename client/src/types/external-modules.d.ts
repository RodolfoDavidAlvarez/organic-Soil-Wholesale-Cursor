declare module "@elevenlabs/react" {
  export function useConversation(options?: Record<string, unknown>): {
    startSession: (options?: Record<string, unknown>) => Promise<void>;
    endSession: () => Promise<void>;
  };
}

declare module "qrcode.react" {
  import type { SVGProps } from "react";

  export function QRCodeSVG(
    props: SVGProps<SVGSVGElement> & {
      value: string;
      size?: number;
      level?: "L" | "M" | "Q" | "H";
      bgColor?: string;
      fgColor?: string;
      includeMargin?: boolean;
    }
  ): JSX.Element;
}
