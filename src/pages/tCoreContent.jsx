import { useState, useEffect, useContext } from "react";
import {
  AppBar,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
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
  DialogTitle,
  DialogContent,
  CircularProgress,
  Box,
} from "@mui/material";

import { enqueueSnackbar } from "notistack";
import {
  i18nContext,
  debugContext,
  postJson,
  doI18n,
  getAndSetJson,
  getJson,
  Header,
} from "pithekos-lib";
import sx from "./Selection.styles";

import ListMenuItem from "./ListMenuItem";
export default function NewTCoreContent() {
  const { i18nRef } = useContext(i18nContext);
  const [burritos, setBurritos] = useState([]);
  const [selectedBurrito, setSelectedBurrito] = useState(null);
  const { debugRef } = useContext(debugContext);
  const [contentName, setContentName] = useState("");
  const [contentAbbr, setContentAbbr] = useState("");
  const [contentType, setContentType] = useState("x-bcvnotes");
  const [contentLanguageCode, setContentLanguageCode] = useState("und");
  const [showBookFields, setShowBookFields] = useState(true);
  const [bookCode, setBookCode] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAbbr, setBookAbbr] = useState("");
  const [postCount, setPostCount] = useState(0);
  const [bookCodes, setBookCodes] = useState([]);
  const [protestantOnly, setProtestantOnly] = useState(true);
  const [openModal, setOpenModal] = useState(true);

  const handleClose = () => {
    setOpenModal(false);
    setTimeout(() => {
      window.location.href = "/clients/content";
    }, 200);
  };
  useEffect(() => {
    if (openModal === true) {
      getAndSetJson({
        url: "/content-utils/versifications",
      }).then();
    }
  }, [openModal]);

  useEffect(() => {
    if (selectedBurrito) {
      setContentName(selectedBurrito.name);
      setContentAbbr(selectedBurrito.abbreviation);
      setContentLanguageCode(selectedBurrito.language_code);
      setBookCodes(selectedBurrito.book_codes);
      setBookCode("");
      setBookTitle("");
      setBookAbbr("");
    }
  }, [selectedBurrito]);

  useEffect(() => {
    const doFetch = async () => {
      const versificationResponse = await getJson(
        "/content-utils/versification/eng",
        debugRef.current
      );
      if (versificationResponse.ok) {
        setBookCodes(Object.keys(versificationResponse.json.maxVerses));
      }
    };
    if (bookCodes.length === 0 && openModal === true) {
      doFetch().then();
    }
  }, [openModal]);

  useEffect(() => {
    setContentName("");
    setContentAbbr("");
    setContentLanguageCode("und");
    setBookCode("");
    setBookTitle("");
    setBookAbbr("");
    setShowBookFields(true);
  }, [postCount]);

  const handleCreate = async () => {
    const payload = {
      content_name: contentName,
      content_abbr: contentAbbr,
      content_language_code: contentLanguageCode,
      add_book: showBookFields,
      book_code: showBookFields ? bookCode : null,
      book_title: showBookFields ? bookTitle : null,
      book_abbr: showBookFields ? bookAbbr : null,
    };
    const response = await postJson(
      "/git/new-bcv-resource",
      JSON.stringify(payload),
      debugRef.current
    );
    if (response.ok) {
      setPostCount(postCount + 1);
      enqueueSnackbar(
        doI18n("pages:content:content_created", i18nRef.current),
        { variant: "success" }
      );
    } else {
      enqueueSnackbar(
        `${doI18n("pages:content:content_creation_error", i18nRef.current)}: ${
          response.status
        }`,
        { variant: "error" }
      );
    }
    handleClose();
  };
  useEffect(() => {
    async function fetchSummaries() {
      try {
        const response = await fetch("/burrito/metadata/summaries");
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        console.log(Array(data));
        // Filter only those with flavor_type = scripture
        const burritoArray = Object.entries(data).map(([key, value]) => ({
          path: key,
          ...value,
        }));

        // Filter only scripture burritos
        const scriptures = burritoArray.filter(
          (item) => item?.flavor_type === "scripture"
        );
        console.log(scriptures);
        setBurritos(scriptures);
      } catch (err) {
        console.error("Error fetching summaries:", err);
      } finally {
      }
    }
    fetchSummaries();
  }, []);

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
        open={openModal}
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
          {" "}
          {doI18n(`pages:content:required_field`, i18nRef.current)}
        </Typography>
        <Stack spacing={2} sx={{ m: 2 }}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="burrito-select-label">
              {doI18n(`pages:content:choose_document`, i18nRef.current)}
            </InputLabel>
            <Select
              labelId="burrito-select-label"
              value={selectedBurrito?.name || ""}
              label="Choose Burrito"
              onChange={handleSelectBurrito}
            >
              {burritos.map((burrito) => (
                <MenuItem key={burrito.name} value={burrito.name}>
                  {burrito.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
                      (protestantOnly ? bookCodes.slice(0, 66) : bookCodes).map(
                        (listItem, n) => (
                          <MenuItem key={n} value={listItem} dense>
                            <ListMenuItem
                              listItem={`${listItem} - ${doI18n(
                                `scripture:books:${listItem}`,
                                i18nRef.current
                              )}`}
                            />
                          </MenuItem>
                        )
                      )}
                  </Select>
                </FormControl>
              </Grid2>
              <Grid2 item size={4}>
                <TextField
                  id="bookAbbr"
                  required
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
                  required
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

          <TextField
            id="name"
            required
            sx={{
              pointerEvents: "none", // disables all mouse interaction
              "& .MuiInputBase-input": {
                cursor: "default", // prevents text cursor
              },
            }}
            label={doI18n("pages:content:name", i18nRef.current)}
            value={contentName}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
            onChange={(event) => {
              setContentName(event.target.value);
            }}
          />
          <TextField
            id="abbr"
            required
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
            id="type"
            required
            disabled={true}
            sx={{
              display: "none",
              pointerEvents: "none", // disables all mouse interaction
              "& .MuiInputBase-input": {
                cursor: "default", // prevents text cursor
              },
            }}
            label={doI18n("pages:content:type", i18nRef.current)}
            value={contentType}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
            onChange={(event) => {
              setContentType(event.target.value);
            }}
          />
          <TextField
            id="languageCode"
            required
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
                contentName.trim().length > 0 &&
                contentAbbr.trim().length > 0 &&
                contentType.trim().length > 0 &&
                contentLanguageCode.trim().length > 0 &&
                (!showBookFields ||
                  (bookCode.trim().length === 3 &&
                    bookTitle.trim().length > 0 &&
                    bookAbbr.trim().length > 0))
              )
            }
            onClick={handleCreate}
          >
            {doI18n("pages:content:create", i18nRef.current)}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
