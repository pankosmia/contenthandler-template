import { useContext, useState, useCallback, useEffect } from "react";
import { Grid2 } from "@mui/material";
import { i18nContext, doI18n } from "pithekos-lib";

function App() {
  const [maxWindowHeight, setMaxWindowHeight] = useState(
    window.innerHeight - 64
  );
  const handleWindowResize = useCallback((event) => {
    setMaxWindowHeight(window.innerHeight - 64);
  }, []);
  const { i18nRef } = useContext(i18nContext);

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleWindowResize]);

  return (
    <Grid2 container spacing={2} sx={{ maxHeight: maxWindowHeight }}>
      <Grid2 size={12}>
        <h1>
          {doI18n(
            "pages:core-contenthandler_text_translation:stub_content",
            i18nRef.current
          )}
        </h1>
      </Grid2>
    </Grid2>
  );
}

export default App;
