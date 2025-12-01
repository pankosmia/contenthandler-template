import { useState, useContext, useEffect } from "react";
import {
    AppBar,
    Button,
    Checkbox,
    Dialog,
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
    Box,
    DialogContent,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import {
    i18nContext,
    debugContext,
    postJson,
    doI18n,
    getJson,
    Header,
    getAndSetJson,
} from "pithekos-lib";
import sx from "./Selection.styles";
import ListMenuItem from "./ListMenuItem";

export default function NewTextTranslationBook() {
    const [addCV, setAddCV] = useState(true);
    const [bookCode, setBookCode] = useState("");
    const [bookTitle, setBookTitle] = useState("");
    const [bookAbbr, setBookAbbr] = useState("");
    const [open, setOpen] = useState(true);
    const [repoPath, setRepoPath] = useState([])
    const { i18nRef } = useContext(i18nContext);
    const { debugRef } = useContext(debugContext);
    const [bookCodes, setBookCodes] = useState([]);
    const [protestantOnly, setProtestantOnly] = useState(true);
    const [bookName, setBookName] = useState([]);
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [versification, setVersification] = useState("eng");
    const [versificationCodes, setVersificationCodes] = useState([]);
    const [fileVrs, setFileVrs] = useState(false);

    const getProjectSummaries = async () => {
        const hash = window.location.hash;
        const query = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(query);
        const path = params.get('repoPath');
        setRepoPath(path);
        const summariesResponse = await getJson(`/burrito/metadata/summary/${path}`, debugContext.current);
        if (summariesResponse.ok) {
            const data = summariesResponse.json;
            const bookCode = data.book_codes;
            setBookName(bookCode);
        } else {
            console.error(`${doI18n("pages:core-contenthandler_text_translation:error_data", i18nRef.current)}`);
        }

    };

    const getProjectFiles = async () => {
        const hash = window.location.hash;
        const query = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(query);
        const path = params.get('repoPath');
        const filesResponse = await getJson(`/burrito/paths/${path}`, debugContext.current);
        if (filesResponse.ok) {
            const data = await filesResponse.json;
            if (data.includes("vrs.json")) {
                setFileVrs(true);
            }
        } else {
            console.error(`${doI18n("pages:core-contenthandler_text_translation:error_data", i18nRef.current)}`);
        }

    };

    useEffect(
        () => {
            getProjectSummaries();
            getProjectFiles();
        },
        []
    );

    useEffect(() => {
        if (open) {
            getAndSetJson({
                url: "/content-utils/versifications",
                setter: setVersificationCodes
            }).then()
        }
    },
        [open]
    );

    useEffect(() => {
        const doFetch = async () => {
            const versificationResponse = await getJson(
                "/content-utils/versification/eng",
                debugRef.current
            );
            if (versificationResponse.ok) {
                const newBookCodes = Object.keys(versificationResponse.json.maxVerses);
                setBookCodes(newBookCodes);
            }
            setBookCode("");
            setBookTitle("");
            setBookAbbr("");
            setVersification("eng");
        };
        if (open) {
            doFetch().then();
        }
    }, [open]);


    const handleClose = () => {
        const url = window.location.search;
        const params = new URLSearchParams(url);
        const returnType = params.get("returntypepage");
        if (returnType === "dashboard") {
            window.location.href = "/clients/main";
        } else {
            window.location.href = "/clients/content";
        }
    };

    const handleCloseCreate = async () => {
        setOpen(false);
        setTimeout(() => {
            window.location.href = '/clients/content';
        },500);
    };

    const handleCreate = async () => {
        const payload = {
            book_code: bookCode,
            book_title: bookTitle,
            book_abbr: bookAbbr,
            add_cv: addCV,
         ...(fileVrs === false ? { vrs_name : versification } : {}),
        };
        const response = await postJson(
            `/git/new-scripture-book/${repoPath}`,
            JSON.stringify(payload),
            debugRef.current
        );
        if (response.ok) {
            enqueueSnackbar(doI18n("pages:content:book_created", i18nRef.current), {
                variant: "success",
            });
            handleCloseCreate();
        } else {
            setErrorMessage(`${doI18n("pages:content:book_creation_error", i18nRef.current)}: ${response.status
                }`);
            setErrorDialogOpen(true);
        };

    };
    const handleCloseErrorDialog = () => {
        setErrorDialogOpen(false);
        handleClose();
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
                    backdropFilter: "blur(3px)",
                }}
            />
            <Header
                titleKey="pages:content:title"
                currentId="content"
                requireNet={false}
            />
            <Dialog
                fullWidth={true}
                open={open}
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
                            {doI18n("pages:content:new_book", i18nRef.current)}
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Typography variant="subtitle2" sx={{ ml: 1, p: 1 }}>
                    {" "}
                    {doI18n(`pages:content:required_field`, i18nRef.current)}
                </Typography>
                <Stack spacing={2} sx={{ m: 2 }}>
                    {fileVrs === false ? (
                        <FormControl>
                            <InputLabel id="booksVersification-label" required htmlFor="booksVersification"
                                sx={sx.inputLabel}>
                                {doI18n("pages:content:versification_scheme", i18nRef.current)}
                            </InputLabel>
                            <Select
                                variant="outlined"
                                required
                                labelId="booksVersification-label"
                                name="booksVersification"
                                inputProps={{
                                    id: "bookVersification",
                                }}
                                value={versification}
                                label={doI18n("pages:content:versification_scheme", i18nRef.current)}
                                onChange={(event) => {
                                    setVersification(event.target.value);
                                }}
                                sx={sx.select}
                            >
                                {
                                    versificationCodes.map((listItem, n) => <MenuItem key={n} value={listItem}
                                        dense>
                                        <ListMenuItem
                                            listItem={`${listItem.toUpperCase()} - ${doI18n(`scripture:versifications:${listItem}`, i18nRef.current)}`}
                                        />
                                    </MenuItem>
                                    )
                                }
                            </Select>
                        </FormControl>
                    ) : null}
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
                                    {(protestantOnly ? bookCodes.slice(0, 66) : bookCodes).map(
                                        (listItem, n) => (
                                            <MenuItem
                                                key={n}
                                                value={listItem}
                                                dense
                                                disabled={bookName.includes(listItem)}
                                            >
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
                                sx={{ width: "100%" }}
                                label={doI18n("pages:content:book_abbr", i18nRef.current)}
                                value={bookAbbr}
                                onChange={(event) => {
                                    setBookAbbr(event.target.value);
                                }}
                            />
                        </Grid2>
                        <Grid2 item size={4}>
                            <TextField
                                id="bookTitle"
                                required
                                sx={{ width: "100%" }}
                                label={doI18n("pages:content:book_title", i18nRef.current)}
                                value={bookTitle}
                                onChange={(event) => {
                                    setBookTitle(event.target.value);
                                }}
                            />
                        </Grid2>
                    </Grid2>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    color="secondary"
                                    checked={protestantOnly}
                                    onChange={() => setProtestantOnly(!protestantOnly)}
                                />
                            }
                            label={doI18n(
                                "pages:content:protestant_books_only",
                                i18nRef.current
                            )}
                        />
                    </FormGroup>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    color="secondary"
                                    checked={addCV}
                                    onChange={() => setAddCV(!addCV)}
                                />
                            }
                            label={doI18n(
                                "pages:content:add_versification_checkbox",
                                i18nRef.current
                            )}
                        />
                    </FormGroup>
                </Stack>
                <DialogActions>
                    <Button onClick={() => handleClose()} color="primary">
                        {doI18n("pages:content:close", i18nRef.current)}
                    </Button>
                    <Button
                        autoFocus
                        variant="contained"
                        color="primary"
                        disabled={
                            !(
                                bookCode.trim().length === 3 &&
                                bookTitle.trim().length > 0 &&
                                bookAbbr.trim().length > 0
                            )
                        }
                        onClick={() => handleCreate()}
                    >
                        {doI18n("pages:content:create", i18nRef.current)}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Error Dialog */}
            <Dialog open={errorDialogOpen} onClose={() => handleCloseErrorDialog()}>
                <DialogContent>
                    <Typography color="error">{errorMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseErrorDialog()} variant="contained" color="primary">
                        {doI18n("pages:content:close", i18nRef.current)}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}