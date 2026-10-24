export const ScreenReaderText = ({ children }: { readonly children: string }) => (
  <span className="sr-only">{` ${children} `}</span>
);
