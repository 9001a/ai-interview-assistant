declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: any;
    metadata: any;
    version: string;
  }

  function parse(buffer: Buffer): Promise<PDFData>;
  export = parse;
}

declare module 'mammoth' {
  interface ExtractResult {
    value: string;
    messages: any[];
  }

  function extractRawText(options: { buffer: Buffer }): Promise<ExtractResult>;
}
