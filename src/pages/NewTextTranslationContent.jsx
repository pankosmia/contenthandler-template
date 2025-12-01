import {useState, useContext, useEffect} from 'react';
import {
    AppBar,
    Button, Checkbox,
    FormControl, FormControlLabel, FormGroup,
    Stack,
    TextField,
    Toolbar,
    Typography,
    Select,
    MenuItem,
    InputLabel, Grid2,
    DialogActions,
    Dialog,
    Box,
    DialogContent,
    Tooltip,
    FormLabel,
    RadioGroup, Radio
} from "@mui/material";
import {i18nContext, debugContext, postJson, doI18n, getAndSetJson, getJson, Header} from "pithekos-lib";
import sx from "./Selection.styles";
import ListMenuItem from "./ListMenuItem";

export default function NewBibleContent() {

    const [open, setOpen] = useState(true)
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const {i18nRef} = useContext(i18nContext);
    const {debugRef} = useContext(debugContext);
    const [contentName, setContentName] = useState("");
    const [contentAbbr, setContentAbbr] = useState("");
    const [contentType, setContentType] = useState("text_translation");
    const [contentLanguageCode, setContentLanguageCode] = useState("und");
    const [contentOption, setContentOption] = useState("book");
    const [metadataSummaries, setMetadataSummaries] = useState({});
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [bookCode, setBookCode] = useState("TIT");
    const [bookTitle, setBookTitle] = useState("Tit");
    const [bookAbbr, setBookAbbr] = useState("Ti");
    const [postCount, setPostCount] = useState(0);
    const [showVersification, setShowVersification] = useState(true);
    const [versification, setVersification] = useState("eng");
    const [versificationCodes, setVersificationCodes] = useState([]);
    const [bookCodes, setBookCodes] = useState([]);
    const [protestantOnly, setProtestantOnly] = useState(true);
    const [localRepos, setLocalRepos] = useState([]);
    const [repoExists, setRepoExists] = useState(false);

    const handleClose = () => {
        const url = window.location.search;
        const params = new URLSearchParams(url);
        const returnType = params.get("returntypepage");

        if (returnType === "dashboard") {
            window.location.href = "/clients/main"
        } else {
            window.location.href = "/clients/content"
        }
    }

    const handleCloseCreate = async () => {
        setOpen(false);
        setTimeout(() => {
            window.location.href = '/clients/content';
        });
    };

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
            if (open) {
                getAndSetJson({
                    url: "/burrito/metadata/summaries",
                    setter: setMetadataSummaries
                }).then()
            }
        },
        [open]
    );

    useEffect(
        () => {
            const doFetch = async () => {
                const versificationResponse = await getJson("/content-utils/versification/eng", debugRef.current);
                if (versificationResponse.ok) {
                    setBookCodes(Object.keys(versificationResponse.json.maxVerses));
                }
            };
            if (bookCodes.length === 0 && open) {
                doFetch().then();
            }
        }, [open]
    );

    useEffect(
        () => {
            if (open) {
                getAndSetJson({
                    url: "/git/list-local-repos",
                    setter: setLocalRepos
                }).then()
            }
        },
        [open]
    );

    useEffect(
        () => {
            setContentName("");
            setContentAbbr("");
            setContentType("text_translation");
            setContentLanguageCode("und");
            setBookCode("TIT");
            setBookTitle("Titus");
            setBookAbbr("Ti");
            setShowVersification(true);
            setVersification("eng");
        },
        [postCount]
    );

    const handleCreate = async () => {
        // versification for plan comes from plan
        let planJson = null;
        let submittedVersification = versification;
        if (contentOption === "plan" && selectedPlan) {
            const planResponse = await getJson(
                `/burrito/ingredient/raw/${selectedPlan}?ipath=plan.json`,
                debugRef.current
            );
            if (planResponse.ok) {
                planJson = planResponse.json;
                submittedVersification = planJson.versification;
            } else {
                console.log(planResponse.error);
                setErrorMessage(`${doI18n("pages:content:content_creation_error", i18nRef.current)}: ${planResponse.status}`);
                setErrorDialogOpen(true);
                return;
            }
        }
        // Make repo (empty for plans)
        const payload = {
            content_name: contentName,
            content_abbr: contentAbbr,
            content_type: contentType,
            content_language_code: contentLanguageCode,
            versification: submittedVersification,
            add_book: contentOption === "book",
            book_code: contentOption === "book" ? bookCode : null,
            book_title: contentOption === "book" ? bookTitle : null,
            book_abbr: contentOption === "book" ? bookAbbr : null,
            add_cv: contentOption === "book" ? showVersification : null,
        };
        const response = await postJson(
            "/git/new-text-translation",
            JSON.stringify(payload),
            debugRef.current
        );
        if (response.ok) {
            setPostCount(postCount + 1);
        } else {
            setErrorMessage(`${doI18n("pages:content:book_creation_error", i18nRef.current)}: ${response.status
            }`);
            setErrorDialogOpen(true);
            return;
        }
        // Add books for plan
        if (planJson) {
            // Get bookCode list
            const bookCodes = Array.from(new Set(planJson.sections.map(s => s.bookCode)));
            for (const bookCode of bookCodes) {
                const bookSections = planJson.sections.filter(s => s.bookCode === bookCode);
                let chapterNo = 0;
                let usfmBits = [];
                usfmBits.push(`\\id ${bookCode} -- ${planJson.short_name} -- v${planJson.version} -- ${planJson.copyright}`);
                for (const headerTag of ["toc1", "toc2", "toc3", "mt"]) {
                    usfmBits.push(`\\${headerTag} ${planJson.name} (${bookCode})`);
                }
                for (const bookSection of bookSections) {
                    usfmBits.push(`\\rem ${bookSection.cv[0]}-${bookSection.cv[1]}`);
                    usfmBits.push(`\\ts\\*`);
                    for (const sectionField of planJson.sectionStructure) {
                        if (sectionField.type === "paraField") {
                            if (bookSection.fieldInitialValues && bookSection.fieldInitialValues[sectionField.name]) {
                                usfmBits.push(`\\${sectionField.paraTag}`);
                                usfmBits.push("___")
                            } else if (planJson.fieldInitialValues && planJson.fieldInitialValues[sectionField.name]) {
                                usfmBits.push(`\\${sectionField.paraTag}`);
                                usfmBits.push("___")
                            }
                        } else if (sectionField.type === "scripture") {
                            for (const para of bookSection.paragraphs) {
                                if (para.units) {
                                    const paraChapter = parseInt(para.units[0].split(":")[0]);
                                    if (paraChapter !== chapterNo) {
                                        usfmBits.push(`\\c ${paraChapter}`);
                                        chapterNo = paraChapter;
                                    }
                                    usfmBits.push(`\\${para.paraTag}`);
                                    for (const unit of para.units) {
                                        const [ch, vr] = unit.split(":");
                                        if (parseInt(ch) !== chapterNo) {
                                            usfmBits.push(`\\c ${ch}`);
                                            chapterNo = parseInt(ch);
                                            usfmBits.push(`\\${para.paraTag}`);
                                        }
                                        usfmBits.push(`\\v ${vr}`);
                                        usfmBits.push("___")
                                    }
                                } else { // bridge
                                    usfmBits.push(`\\rem ${para.cv[0]}-${para.cv[1]}`);
                                    usfmBits.push(`\\${para.paraTag}`);
                                    usfmBits.push("___")
                                }
                            }
                        }
                    }
                }
                const payload = {
                  payload: usfmBits.join("\n")
                };
                const newBookResponse = await postJson(
                    `/burrito/ingredient/raw/_local_/_local_/${contentAbbr}?ipath=${bookCode}.usfm&update_ingredients`,
                    JSON.stringify(payload)
                );
                if (!newBookResponse.ok) {
                    setErrorMessage(`${doI18n("pages:content:book_creation_error", i18nRef.current)}: ${response.status
                    }`);
                    setErrorDialogOpen(true);
                    return;
                }
            }
        }
        await handleCloseCreate();
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

                <AppBar color='secondary' sx={{position: 'relative', borderTopLeftRadius: 4, borderTopRightRadius: 4}}>
                    <Toolbar>
                        <Typography variant="h6" component="div">
                            {doI18n("pages:core-contenthandler_text_translation:create_content_text_translation", i18nRef.current)}                        
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Typography variant='subtitle2'
                            sx={{ml: 1, p: 1}}> {doI18n(`pages:content:required_field`, i18nRef.current)}</Typography>
                <Stack spacing={2} sx={{m: 2}}>
                    <TextField
                        id="name"
                        required
                        label={doI18n("pages:content:name", i18nRef.current)}
                        value={contentName}
                        onChange={(event) => {
                            setContentName(event.target.value);
                        }}
                    />
                    <Tooltip
                        open={repoExists}

                        slotProps={{ popper: { modifiers: [{ name: 'offset', options: { offset: [0, -7] } }] } }}
                        title={doI18n("pages:core-contenthandler_text_translation:name_is_taken", i18nRef.current)} placement="top-start"
                    >
                        <TextField
                            id="abbr"
                            required
                            label={doI18n("pages:content:abbreviation", i18nRef.current)}
                            value={contentAbbr}
                            onChange={(event) => {
                                setRepoExists(localRepos.map(l => l.split("/")[2]).includes(event.target.value));
                                setContentAbbr(event.target.value);
                            }}
                        />
                    </Tooltip>
                    <TextField
                        id="type"
                        required
                        disabled={true}
                        sx={{display: "none"}}
                        label={doI18n("pages:content:type", i18nRef.current)}
                        value={contentType}
                        onChange={(event) => {
                            setContentType(event.target.value);
                        }}
                    />
                    <TextField
                        id="languageCode"
                        required
                        label={doI18n("pages:content:lang_code", i18nRef.current)}
                        value={contentLanguageCode}
                        onChange={(event) => {
                            setContentLanguageCode(event.target.value);
                        }}
                    />
                    <FormControl>
                        <FormLabel
                            id="book-create-options">
                            {doI18n("pages:core-contenthandler_text_translation:add_content", i18nRef.current)}
                        </FormLabel>
                        <RadioGroup
                            row
                            aria-labelledby="book-create-options"
                            name="book-create-options-radio-group"
                            value={contentOption}
                            onClick={event => setContentOption(event.target.value)}
                        >
                            <FormControlLabel value="none" control={<Radio/>}
                                              label={doI18n("pages:core-contenthandler_text_translation:no_content_radio", i18nRef.current)}/>
                            <FormControlLabel value="book" control={<Radio/>}
                                              label={doI18n("pages:core-contenthandler_text_translation:book_content_radio", i18nRef.current)}/>
                            <FormControlLabel value="plan" control={<Radio/>}
                                              label={doI18n("pages:core-contenthandler_text_translation:plan_content_radio", i18nRef.current)}/>
                        </RadioGroup>
                    </FormControl>
                    {
                        (contentOption === "book") && <>
                            <Grid2 container spacing={2} justifyItems="flex-end" alignItems="stretch">
                                <Grid2 item size={4}>
                                    <FormControl sx={{width: "100%"}}>
                                        <InputLabel id="bookCode-label" required htmlFor="bookCode" sx={sx.inputLabel}>
                                            {doI18n("pages:content:book_code", i18nRef.current)}
                                        </InputLabel>
                                        <Select
                                            variant="outlined"
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
                                                    ["1", "2", "3"].includes(event.target.value[0]) ?
                                                        event.target.value.slice(0, 2) + event.target.value[2].toLowerCase() :
                                                        event.target.value[0] + event.target.value.slice(1).toLowerCase()
                                                );
                                                setBookTitle(doI18n(`scripture:books:${event.target.value}`, i18nRef.current))
                                            }}
                                            sx={sx.select}
                                        >
                                            {
                                                (protestantOnly ? bookCodes.slice(0, 66) : bookCodes).map((listItem, n) =>
                                                    <MenuItem key={n} value={listItem} dense>
                                                        <ListMenuItem
                                                            listItem={`${listItem} - ${doI18n(`scripture:books:${listItem}`, i18nRef.current)}`}/>
                                                    </MenuItem>
                                                )
                                            }
                                        </Select>
                                    </FormControl>

                                </Grid2>
                                <Grid2 item size={4}>
                                    <TextField
                                        id="bookAbbr"
                                        required
                                        sx={{width: "100%"}}
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
                                        sx={{width: "100%"}}
                                        label={doI18n("pages:content:book_title", i18nRef.current)}
                                        value={bookTitle}
                                        onChange={(event) => {
                                            setBookTitle(event.target.value);
                                        }}
                                    />
                                </Grid2>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                color='secondary'
                                                checked={protestantOnly}
                                                onChange={() => setProtestantOnly(!protestantOnly)}
                                            />
                                        }
                                        label={doI18n("pages:content:protestant_books_only", i18nRef.current)}
                                    />
                                </FormGroup>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                color='secondary'
                                                checked={showVersification}
                                                onChange={() => setShowVersification(!showVersification)}
                                            />
                                        }
                                        label={doI18n("pages:content:add_versification_checkbox", i18nRef.current)}
                                    />
                                </FormGroup>
                            </Grid2>

                        </>
                    }
                    {
                        (contentOption === "plan") &&
                        <Grid2 container spacing={2} justifyItems="flex-end" alignItems="stretch">
                            <Grid2 item size={12}>
                                <FormControl sx={{width: "100%"}}>
                                    <InputLabel id="select-plan-label" required htmlFor="plan" sx={sx.inputLabel}>
                                        {doI18n("pages:core-contenthandler_text_translation:select_plan", i18nRef.current)}
                                    </InputLabel>
                                    <Select
                                        variant="outlined"
                                        required
                                        labelId="plan-label"
                                        name="plan"
                                        inputProps={{
                                            id: "bookCode",
                                        }}
                                        value={selectedPlan}
                                        label={doI18n("pages:core-contenthandler_text_translation:select_plan", i18nRef.current)}
                                        onChange={event => {
                                            setSelectedPlan(event.target.value);
                                        }}
                                        sx={sx.select}
                                    >
                                        {
                                            Object.entries(metadataSummaries)
                                                .filter(r => r[1].flavor === "x-translationplan")
                                                .map(r =>
                                                    <MenuItem key={r[0]} value={r[0]} dense>
                                                        <ListMenuItem
                                                            listItem={r[1].name}/>
                                                    </MenuItem>
                                                )
                                        }
                                    </Select>
                                </FormControl>
                            </Grid2>
                        </Grid2>
                    }
                    {
                        contentOption !== "plan" &&
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
                    }
                </Stack>
                <DialogActions>
                    <Button
                        onClick={handleClose}
                        color='primary'
                    >
                        {doI18n("pages:content:close", i18nRef.current)}
                    </Button>
                    <Button
                        autoFocus
                        variant='contained'
                        color="primary"
                        disabled={
                            !(
                                contentName.trim().length > 0 &&
                                contentAbbr.trim().length > 0 &&
                                contentType.trim().length > 0 &&
                                contentLanguageCode.trim().length > 0 &&
                                versification.trim().length === 3 &&
                                (
                                    !(contentOption === "book") || (
                                        bookCode.trim().length === 3 &&
                                        bookTitle.trim().length > 0 &&
                                        bookAbbr.trim().length > 0
                                    )
                                ) &&
                                (
                                    !(contentOption === "plan") || selectedPlan
                                )
                            )
                            ||
                            repoExists
                        }
                        onClick={handleCreate}
                    >
                        {doI18n("pages:content:create", i18nRef.current)}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* Error Dialog*/}
            <Dialog open={errorDialogOpen} onClose={handleCloseErrorDialog}>
                <DialogContent>
                    <Typography color="error">{errorMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseErrorDialog} variant="contained" color="primary">
                        {doI18n("pages:content:close", i18nRef.current)}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>

    );
}