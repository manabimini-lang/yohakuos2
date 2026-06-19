declare module "@sparticuz/chromium" {
  const chromium: {
    args: string[];
    executablePath(): Promise<string>;
  };

  export default chromium;
}

declare module "playwright-core" {
  export const chromium: {
    launch(options: {
      args?: string[];
      executablePath?: string;
      headless?: boolean;
    }): Promise<{
      newContext(options?: {
        viewport?: { width: number; height: number };
        deviceScaleFactor?: number;
      }): Promise<{
        newPage(): Promise<{
          goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<void>;
          screenshot(options?: { type?: string; quality?: number }): Promise<Buffer>;
        }>;
      }>;
      close(): Promise<void>;
    }>;
  };
}
