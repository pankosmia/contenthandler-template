import { useContext, useState, useCallback, useEffect } from "react";
import { Button, Chip, Grid2 } from "@mui/material";
import { i18nContext, doI18n } from "pithekos-lib";
import { useNavigate } from "react-router-dom";
function App() {
  const [maxWindowHeight, setMaxWindowHeight] = useState(
    window.innerHeight - 64
  );
  const handleWindowResize = useCallback((event) => {
    setMaxWindowHeight(window.innerHeight - 64);
  }, []);
  const { i18nRef } = useContext(i18nContext);
  const navigate = useNavigate();

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
            "pages:contenthandler-template:stub_content",
            i18nRef.current
          )}
        </h1>
      </Grid2>
      <Chip
        label="bouton create"
        color="secondary"
        variant="outlined"
         onClick={() => navigate("createPage")}
      />
      <Chip
        label="bouton update"
        color="secondary"
        variant="outlined"
         onClick={() => navigate("updatePage")}
      />
    </Grid2>
  );
}

export default App;
