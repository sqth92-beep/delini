import { createContext, useContext, useCallback } from "react";
import { useLocation } from "wouter";

interface PreviewContextValue {
  isPreview: boolean;
  prefixLink: (href: string) => string;
}

const PreviewContext = createContext<PreviewContextValue>({
  isPreview: false,
  prefixLink: (href) => href,
});

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  return (
    <PreviewContext.Provider value={{ 
      isPreview: true, 
      prefixLink: (href) => href === "/" ? "/preview" : `/preview${href}` 
    }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  return useContext(PreviewContext);
}

export function usePreviewNavigate() {
  const { prefixLink } = usePreview();
  const [, setLocation] = useLocation();
  
  const navigate = useCallback((href: string) => {
    setLocation(prefixLink(href));
  }, [prefixLink, setLocation]);
  
  return navigate;
}

export function useIsPreviewMode() {
  const [location] = useLocation();
  return location.startsWith("/preview");
}
