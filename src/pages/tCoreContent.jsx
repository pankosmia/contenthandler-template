import { useState, useEffect, useContext } from "react";
import {
  AppBar,
  Button,
  FormControl,
  Stack,
  TextField,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  Grid2,
  DialogActions,
  Dialog,
  Box,
  DialogContent,
} from "@mui/material";

import {
  i18nContext,
  debugContext,
  postJson,
  doI18n,
  Header,
  getJson,
} from "pithekos-lib";
import sx from "./Selection.styles";

import ListMenuItem from "./ListMenuItem";

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

  const checkExistingRepo = async (name) => {
    const response = await getJson("/burrito/metadata/summaries");
    const data = await response.json;

    // Filter only those with flavor_type = scripture
    const burritoArray = Object.entries(data).map(([key, value]) => ({
      path: key,
      ...value,
    }));

    const scriptures = burritoArray.find(
      (item) => item?.flavor === "x-tcore" && item?.abbreviation === name
    );
    if (scriptures) {
      if (Object.keys(scriptures).length > 0) {
        return true;
      }
    }
    return false;
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

  const handleCreate = async () => {
    let isHere = await checkExistingRepo(
      `${selectedBurrito.abbreviation.toLowerCase()}_tcchecks`
    );
    if (isHere) {
      setErrorMessage(
        `${doI18n(
          "pages:core-contenthandler_t_core:project_already_exist",
          i18nRef.current
        )}`
      );
      setErrorDialogOpen(true);
    } else {
      const payload = {
        usfm_repo_path: selectedBurrito.path,
        book_code: bookCode,
      };
      const response = await postJson(
        "/git/new-tcore-resource",
        JSON.stringify(payload),
        debugRef.current
      );
      if (response.ok) {
        window.location.href = `/clients/main/#/${selectedBurrito.abbreviation.toLowerCase()}_tcchecks`;
      } else {
        setErrorMessage(
          `${doI18n(
            "pages:core-contenthandler_t_core:t_core_project_not_created",
            i18nRef.current
          )}: ${response.status}`
        );
        setErrorDialogOpen(true);
      }
    }
  };
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
            item.path.startsWith("_local_/_local_")
        );
        if (scriptures.length <= 0) {
          setErrorMessage(
            doI18n(
              `pages:core-contenthandler_t_core:no_local_project`,
              i18nRef.current
            )
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
          `${b.abbreviation.toLowerCase()}_tcchecks`
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
                i18nRef.current
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
                i18nRef.current
              )}
            >
              {burritos.map((burrito) => {
                const repoExists = errorBurrito.find(
                  (e) => e.path == burrito.path
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
          <>
            <Grid2
              container
              spacing={2}
              justifyItems="flex-end"
              alignItems="stretch"
            >
              <Grid2 item size={4}>
                <FormControl sx={{ width: "100%" }}>
                  <InputLabel
                    id="bookCode-label"
                    required
                    htmlFor="bookCode"
                    sx={sx.inputLabel}
                  >
                    {doI18n("pages:content:book_code", i18nRef.current)}
                  </InputLabel>
                  <Select
                    variant="outlined"
                    required
                    labelId="bookCode-label"
                    name="bookCode"
                    inputProps={{
                      id: "bookCode",
                    }}
                    value={bookCode}
                    label={doI18n("pages:content:book_code", i18nRef.current)}
                    onChange={(event) => {
                      setBookCode(event.target.value);
                      setBookAbbr(
                        ["1", "2", "3"].includes(event.target.value[0])
                          ? event.target.value.slice(0, 2) +
                              event.target.value[2].toLowerCase()
                          : event.target.value[0] +
                              event.target.value.slice(1).toLowerCase()
                      );
                      setBookTitle(
                        doI18n(
                          `scripture:books:${event.target.value}`,
                          i18nRef.current
                        )
                      );
                    }}
                    sx={sx.select}
                  >
                    {selectedBurrito?.name &&
                      selectedBurrito.book_codes.map((listItem, n) => (
                        <MenuItem key={n} value={listItem} dense>
                          <ListMenuItem
                            listItem={`${listItem} - ${doI18n(
                              `scripture:books:${listItem}`,
                              i18nRef.current
                            )}`}
                          />
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 item size={4}>
                <TextField
                  id="bookAbbr"
                  disabled
                  sx={{
                    width: "100%",
                    pointerEvents: "none", // disables all mouse interaction
                    "& .MuiInputBase-input": {
                      cursor: "default", // prevents text cursor
                    },
                  }}
                  label={doI18n("pages:content:book_abbr", i18nRef.current)}
                  value={bookAbbr}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  onChange={(event) => {
                    setBookAbbr(event.target.value);
                  }}
                />
              </Grid2>
              <Grid2 item size={4}>
                <TextField
                  id="bookTitle"
                  disabled
                  sx={{
                    width: "100%",
                    pointerEvents: "none", // disables all mouse interaction
                    "& .MuiInputBase-input": {
                      cursor: "default", // prevents text cursor
                    },
                  }}
                  label={doI18n("pages:content:book_title", i18nRef.current)}
                  value={bookTitle}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  onChange={(event) => {
                    setBookTitle(event.target.value);
                  }}
                />
              </Grid2>
            </Grid2>
          </>
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
                contentLanguageCode.trim().length > 0 &&
                bookCode.trim().length === 3 &&
                bookTitle.trim().length > 0 &&
                bookAbbr.trim().length > 0
              )
            }
            onClick={handleCreate}
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
