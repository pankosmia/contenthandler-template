import { useState, useEffect, useContext } from "react";
import {
  AppBar,
  Button,
  FormControl,
  Stack,
  TextField,
  Toolbar,
  Typography,
  MenuItem,
  DialogActions,
  Dialog,
  Box,
  DialogContent,
} from "@mui/material";

import { postJson, doI18n, getJson, postEmptyJson } from "pithekos-lib";
import { i18nContext, debugContext, Header } from "pankosmia-rcl";
import { enqueueSnackbar } from "notistack";
const checkExistingRepo = async (name) => {
  const response = await getJson("/burrito/metadata/summaries");
  const data = await response.json;

  // Filter only those with flavor_type = scripture
  const burritoArray = Object.entries(data).map(([key, value]) => ({
    path: key,
    ...value,
  }));

  const scriptures = burritoArray.find(
    (item) => item?.flavor === "x-tcore" && item?.abbreviation === name,
  );
  if (scriptures) {
    if (Object.keys(scriptures).length > 0) {
      return true;
    }
  }
  return false;
};

export const handleCreate = async (burritoAbr, debugRef, i18nRef) => {
  let isHere = await checkExistingRepo(`${burritoAbr.toLowerCase()}_tcchecks`);
  if (isHere) {
    enqueueSnackbar(
      `${doI18n(
        "pages:core-contenthandler_t_core:project_already_exist",
        i18nRef.current,
      )}`,
      {
        variant: "error",
      },
    );
  } else {
    const payload = {
      usfm_repo_path: `_local_/_local_/${burritoAbr}`,
      book_code: "",
    };
    const response = await postJson(
      "/git/new-tcore-resource",
      JSON.stringify(payload),
      debugRef.current,
    );
    if (response.ok) {
      return true;
    } else {
      enqueueSnackbar(
        `${doI18n(
          "pages:core-contenthandler_t_core:t_core_project_not_created",
          i18nRef.current,
        )}: ${response.status}`,
        {
          variant: "error",
        },
      );
    }
  }
};

export default function NewTCoreContent() {
  const { i18nRef } = useContext(i18nContext);
  const { debugRef } = useContext(debugContext);

  const [burritos, setBurritos] = useState([]);
  const [selectedBurrito, setSelectedBurrito] = useState(null);
  const [errorBurrito, setErrorBurritos] = useState([]);

  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [contentAbbr, setContentAbbr] = useState("");
  const [contentLanguageCode, setContentLanguageCode] = useState("und");
  const [bookCode, setBookCode] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAbbr, setBookAbbr] = useState("");

  const handleClose = () => {
    setTimeout(() => {
      window.location.href = "/clients/content";
      // window.location.href = `/clients/main/#/${selectedBurrito.abbreviation.toLowerCase()}_tcchecks`;
    }, 200);
  };

  const handleCloseErrorDialog = () => {
    setErrorDialogOpen(false);
    handleClose();
  };

  useEffect(() => {
    if (selectedBurrito) {
      setContentAbbr(selectedBurrito.abbreviation);
      setContentLanguageCode(selectedBurrito.language_code);
      setBookCode("");
      setBookTitle("");
      setBookAbbr("");
    }
  }, [selectedBurrito]);

  useEffect(() => {
    setContentAbbr("");
    setContentLanguageCode("und");
    setBookCode("");
    setBookTitle("");
    setBookAbbr("");
  }, []);

  useEffect(() => {
    async function fetchSummaries() {
      try {
        const response = await getJson("/burrito/metadata/summaries");
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json;
        // Filter only those with flavor_type = scripture
        const burritoArray = Object.entries(data).map(([key, value]) => ({
          path: key,
          ...value,
        }));

        // Filter only scripture burritos
        const scriptures = burritoArray.filter(
          (item) =>
            item?.flavor === "textTranslation" &&
            item.path.startsWith("_local_/_local_"),
        );
        if (scriptures.length <= 0) {
          setErrorMessage(
            doI18n(
              `pages:core-contenthandler_t_core:no_local_project`,
              i18nRef.current,
            ),
          );
          setErrorDialogOpen(true);
        }
        setBurritos(scriptures);
      } catch (err) {
        console.error("Error fetching summaries:", err);
      } finally {
      }
    }
    fetchSummaries();
  }, [i18nRef.current]);

  useEffect(() => {
    if (!burritos.length) return;

    const checkRepos = async () => {
      let err = [];
      for (let b of burritos) {
        let result = await checkExistingRepo(
          `${b.abbreviation.toLowerCase()}_tcchecks`,
        );
        if (result) err.push(b);
      }
      setErrorBurritos(err);
    };

    checkRepos();
  }, [burritos]);

  const handleSelectBurrito = (event) => {
    const name = event.target.value;
    const burrito = burritos.find((b) => b.name === name);
    setSelectedBurrito(burrito);
  };

  return (
    <Box>
      <Box
        sx={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: -1,
          backgroundImage:
            'url("/app-resources/pages/content/background_blur.png")',
          backgroundRepeat: "no-repeat",
        }}
      />
      <Header
        titleKey="pages:content:title"
        currentId="content"
        requireNet={false}
      />
      <Dialog
        fullWidth={true}
        open={true}
        onClose={handleClose}
        sx={{
          backdropFilter: "blur(3px)",
        }}
      >
        <AppBar
          color="secondary"
          sx={{
            position: "relative",
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
          }}
        >
          <Toolbar>
            <Typography variant="h6" component="div">
              {doI18n(
                `pages:core-contenthandler_t_core:create_content_tCore`,
                i18nRef.current,
              )}
            </Typography>
          </Toolbar>
        </AppBar>
        <Typography variant="subtitle2" sx={{ ml: 1, p: 1 }}>
          {doI18n(`pages:content:required_field`, i18nRef.current)}
        </Typography>
        <Stack spacing={2} sx={{ m: 2 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <TextField
              required
              id="burrito-select-label"
              select
              value={selectedBurrito?.name || ""}
              onChange={handleSelectBurrito}
              label={doI18n(
                `pages:core-contenthandler_t_core:choose_document`,
                i18nRef.current,
              )}
            >
              {burritos.map((burrito) => {
                const repoExists = errorBurrito.find(
                  (e) => e.path == burrito.path,
                );
                return (
                  <MenuItem
                    key={burrito.name}
                    value={burrito.name}
                    disabled={repoExists}
                  >
                    {burrito.name}
                  </MenuItem>
                );
              })}
            </TextField>
          </FormControl>
          <TextField
            id="abbr"
            disabled
            sx={{
              pointerEvents: "none", // disables all mouse interaction
              "& .MuiInputBase-input": {
                cursor: "default", // prevents text cursor
              },
            }}
            label={doI18n("pages:content:abbreviation", i18nRef.current)}
            value={contentAbbr}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
            onChange={(event) => {
              setContentAbbr(event.target.value);
            }}
          />
          <TextField
            id="languageCode"
            sx={{
              pointerEvents: "none", // disables all mouse interaction
              "& .MuiInputBase-input": {
                cursor: "default", // prevents text cursor
              },
            }}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
            disabled
            label={doI18n("pages:content:lang_code", i18nRef.current)}
            value={contentLanguageCode}
            onChange={(event) => {
              setContentLanguageCode(event.target.value);
            }}
          />
        </Stack>

        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {doI18n("pages:content:close", i18nRef.current)}
          </Button>
          <Button
            autoFocus
            variant="contained"
            color="primary"
            disabled={
              !(
                contentAbbr.trim().length > 0 &&
                contentLanguageCode.trim().length > 0
              )
            }
            onClick={async () => {
              let isOk = handleCreate(
                selectedBurrito.abbreviation,
                debugRef,
                i18nRef,
              );
              if (isOk) {
                await postEmptyJson(
                  `/app-state/current-project/_local_/_local_/${selectedBurrito.abbreviation.toLowerCase()}_tcchecks`,
                );
                window.location.href = `/clients/uw-client-checks#`;
              }
            }}
          >
            {doI18n("pages:content:create", i18nRef.current)}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Error Dialog */}
      <Dialog open={errorDialogOpen} onClose={handleCloseErrorDialog}>
        <DialogContent>
          <Typography color="error">{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseErrorDialog}
            variant="contained"
            color="primary"
          >
            {doI18n("pages:content:close", i18nRef.current)}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
