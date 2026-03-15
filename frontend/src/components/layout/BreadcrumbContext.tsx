import React, { createContext, useContext, useState, useCallback } from 'react';

interface BreadcrumbContextValue {
  labels: Record<string, string>;
  setLabel: (key: string, label: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  labels: {},
  setLabel: () => {},
});

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((key: string, label: string) => {
    setLabels((prev) => (prev[key] === label ? prev : { ...prev, [key]: label }));
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumbContext = () => useContext(BreadcrumbContext);

/** Call this in a detail page to register the entity name for the breadcrumb. */
export const useSetBreadcrumb = (key: string | undefined, label: string | undefined) => {
  const { setLabel } = useBreadcrumbContext();
  React.useEffect(() => {
    if (key && label) setLabel(key, label);
  }, [key, label, setLabel]);
};
