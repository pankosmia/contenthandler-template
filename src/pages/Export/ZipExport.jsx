import {useContext, useState, useEffect } from 'react';
import {
    AppBar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    FormControl,
    FormControlLabel,
    MenuItem,
    OutlinedInput,
    Radio,
    RadioGroup,
    Select,
    Toolbar,
    Typography
} from "@mui/material";
import { getText, debugContext, i18nContext, doI18n, getJson, Header } from "pithekos-lib";
import { enqueueSnackbar } from "notistack";
import { useExportUsfmZip } from 'zip-project';

function ZipExport() {

    const [open, setOpen] = useState(true);
    const { i18nRef } = useContext(i18nContext);
    const { debugRef } = useContext(debugContext);
    const [bookNames, setBookNames] = useState();
    const [selectedBooks, setSelectedBooks] = useState(bookNames);
    const [bookCodes, setBookCodes] = useState([]);
    const [zipSet, setZipSet] = useState('all');
    const [repoPath, setRepoPath] = useState([])

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
            setBookNames(bookCode);
        } else {
            console.error(" Erreur lors de la récupération des données.");
        }
    };
    useEffect(
        () => {
            getProjectSummaries();
        },
        []
    );

    let newZip = [];
    const usfmExportZip = async () => {
        for (const bookCode of zipSetBooks) {
            await usfmExportZipContents(bookCode);
        }
        const zippedFiles = newZip.map(item => item.filename).join(', ');
        handleExportZip();
        enqueueSnackbar(
            `${doI18n("pages:content:saved", i18nRef.current)} usfm_files.zip ${doI18n("pages:content:to_download_folder", i18nRef.current)}. ${doI18n("pages:content:contents", i18nRef.current)}: ${zippedFiles}`,
            { variant: "success" }
        );
    }

    const usfmExportZipContents = async bookCode => {
        const bookUrl = `/burrito/ingredient/raw/${repoPath}?ipath=${bookCode}.usfm`;
        const bookUsfmResponse = await getText(bookUrl, debugRef.current);
        if (!bookUsfmResponse.ok) {
            enqueueSnackbar(
                `${doI18n("pages:core-contenthandler_text_translation:could_not_fetch", i18nRef.current)} ${bookCode}`,
                { variant: "error" }
            );
            setTimeout(() => {
                window.location.href = '/clients/content';
            }, 500);
            return false;
        }
        const usfmFile = { filename: `${bookCode}.usfm`, usfmText: `${bookUsfmResponse.text}` };
        newZip.push(usfmFile);
        return true;
    }

    const { handleExportZip } = useExportUsfmZip(newZip);

    const handleBooksChange = (event) => {
        const value = event.target.value;
        setSelectedBooks(
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const zipSetBooks = (zipSet === 'all' ? bookNames : selectedBooks)

    const handleZipSetChange = (event, newValue) => {
        setZipSet(newValue);
        if (newValue === 'all') {
            setSelectedBooks(bookNames);
        } else {
            setSelectedBooks([]);
        }
    };

    useEffect(
        () => {
            const doFetch = async () => {
                const versificationResponse = await getJson("/content-utils/versification/eng", debugRef.current);
                if (versificationResponse.ok) {
                    setBookCodes(Object.keys(versificationResponse.json.maxVerses));
                }
            };
            if (bookCodes.length === 0) {
                doFetch().then();
            }
        },
        []
    );
 
    const handleClose = () => {
        setOpen(false);
        return window.location.href = "/clients/content"
    }

    const handleCloseCreate = async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.href = "/clients/content"
    }

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
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        component: 'form',
                    },
                }}
                sx={{
                    backdropFilter: "blur(3px)",
                }}

            >
                <AppBar color='secondary' sx={{ position: 'relative', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <Toolbar>
                        <Typography variant="h6" component="div">
                            {doI18n("pages:core-contenthandler_text_translation:export_as_zip", i18nRef.current)}
                        </Typography>
                    </Toolbar>
                </AppBar>
                <DialogContent sx={{ mt: 1 }}>
                    {
                        zipSet !== 'all' &&
                        <Select
                            variant="standard"
                            multiple
                            displayEmpty
                            disabled={zipSet === 'all'}
                            value={selectedBooks}
                            onChange={handleBooksChange}
                            input={<OutlinedInput />}
                            renderValue={(selected) => {
                                if (selected.length === 0) {
                                    return <em>{doI18n("pages:content:books", i18nRef.current)}</em>;
                                }
                                return (
                                    <Box sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                                        {selected
                                            .map(s => doI18n(`scripture:books:${s}`, i18nRef.current))
                                            .join(', ')}
                                    </Box>
                                );
                            }}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 224,
                                        width: 250,
                                    },
                                }
                            }}
                            inputProps={{ 'aria-label': 'Without label' }}
                        >
                            <MenuItem disabled value="">
                                <em>{doI18n("pages:content:books", i18nRef.current)}</em>
                            </MenuItem>
                            {bookCodes.filter(item => bookNames.includes(item)).map((bookName) => (
                                <MenuItem
                                    key={bookName}
                                    value={bookName}
                                >
                                    {`${bookName} - ` + doI18n(`scripture:books:${bookName}`, i18nRef.current)}
                                </MenuItem>
                            ))}
                        </Select>
                    }
                    <DialogContentText>
                        <FormControl>
                            <RadioGroup
                                aria-labelledby="radio-buttons-group-label"
                                defaultValue="all"
                                name="radio-buttons-group"
                                onChange={handleZipSetChange}
                            >
                                <FormControlLabel value="pick" control={<Radio />} label={doI18n("pages:core-contenthandler_text_translation:pick_one_or_more_books_export", i18nRef.current)} />
                                <FormControlLabel value="all" control={<Radio />} label={doI18n("pages:core-contenthandler_text_translation:export_all", i18nRef.current)} />
                            </RadioGroup>
                        </FormControl>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="text"
                        color="primary"
                        onClick={handleClose}
                    >
                        {doI18n("pages:content:cancel", i18nRef.current)}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!zipSetBooks || zipSetBooks.length === 0}
                        onClick={() => {
                            if (!zipSetBooks || zipSetBooks.length === 0) {
                                setTimeout(() => {
                                    window.location.href = '/clients/content';
                                }, 1000);
                                enqueueSnackbar(
                                    doI18n("pages:core-contenthandler_text_translation:no_books_selected", i18nRef.current),
                                    { variant: "warning" }
                                );
                            } else {
                                usfmExportZip(zipSetBooks);
                            }
                            handleCloseCreate();
                        }}
                    >
                        {doI18n("pages:core-contenthandler_text_translation:export_label", i18nRef.current)}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ZipExport;
