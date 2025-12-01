import { useRef, useContext, useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    FormControl,
    Select,
    Menu,
    MenuItem,
    OutlinedInput,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Checkbox,
    Switch,
    Toolbar,
    AppBar,
    Box,
    useTheme
} from "@mui/material";
import LooksOneOutlinedIcon from '@mui/icons-material/LooksOneOutlined';
import LooksTwoOutlinedIcon from '@mui/icons-material/LooksTwoOutlined';
import Looks3OutlinedIcon from '@mui/icons-material/Looks3Outlined';
import ViewHeadlineOutlinedIcon from '@mui/icons-material/ViewHeadlineOutlined';
import { Proskomma } from 'proskomma-core';
import { SofriaRenderFromProskomma, render } from "proskomma-json-tools";
import { getText, debugContext, i18nContext, doI18n, typographyContext, getJson, Header } from "pithekos-lib";
import { enqueueSnackbar } from "notistack";
import { getCVTexts, getBookName } from "../helpers/cv";
import GraphiteTest from './GraphiteTest';
import TextDir from '../helpers/TextDir';

function PdfGenerate() {

    const { typographyRef } = useContext(typographyContext);
    const { i18nRef } = useContext(i18nContext);
    const { debugRef } = useContext(debugContext);
    const fileExport = useRef();
    const [selectedBooks, setSelectedBooks] = useState(null);
    const [bookCodes, setBookCodes] = useState([]);
    const [showByVerse, setShowByVerse] = useState(false);

    const [showTitles, setShowTitles] = useState(true);
    const [showHeadings, setShowHeadings] = useState(true);
    const [showIntroductions, setShowIntroductions] = useState(true);
    const [showFootnotes, setShowFootnotes] = useState(false);
    const [showXrefs, setShowXrefs] = useState(false);
    const [showParaStyles, setShowParaStyles] = useState(true);
    const [showCharacterMarkup, setShowCharacterMarkup] = useState(true);
    const [showChapterLabels, setShowChapterLabels] = useState(true);
    const [showVersesLabels, setShowVersesLabels] = useState(true);
    const [showFirstVerseLabel, setShowFirstVerseLabel] = useState(true);
    const [selectedColumns, setSelectedColumns] = useState(2);
    const [bookNames, setBookNames] = useState([]);
    const [repoPath, setRepoPath] = useState([]);
    const [open, setOpen] = useState(true);

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

    const handleCloseCreate = async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        window.location.href = "/clients/content"
    }

    const isGraphite = GraphiteTest()
    /** adjSelectedFontClass reshapes selectedFontClass if Graphite is absent. */
    const adjSelectedFontClass = isGraphite ? typographyRef.current.font_set : typographyRef.current.font_set.replace(/Pankosmia-AwamiNastaliq(.*)Pankosmia-NotoNastaliqUrdu/ig, 'Pankosmia-NotoNastaliqUrdu');

    // Eliminating _webfonts.css pdf load by getting computed font styles.
    // If/when we use adjSelectedFontClass on an element, then reduce to `const computedStyles = window.getComputedStyle(elementRef.current);`
    const [adjSelectedFontFamilies, setAdjSelectedFontFamilies] = useState(null);
    useEffect(() => {
      const tempElement = document.createElement('div'); // Temporary element with adjSelectedFontClass className
      tempElement.className = adjSelectedFontClass;
      document.body.appendChild(tempElement);

      const computedStyles = window.getComputedStyle(tempElement); // Get font-family from adjSelectedFontClass
      setAdjSelectedFontFamilies(computedStyles.fontFamily);

      document.body.removeChild(tempElement); // Remove temporary element
    }, [adjSelectedFontClass]);

    const theme = useTheme(); // used for DOM preview print button style

    const generatePdf = async (bookCode, pdfType = "para") => {
        let pdfHtml;
        if (pdfType === "para") {
            const pdfTemplate = `

<section style="page-break-inside: avoid">
%%BODY%%
</section>
`;
            const bookUrl = `/burrito/ingredient/raw/${repoPath}?ipath=${bookCode}.usfm`;
            const bookUsfmResponse = await getText(bookUrl, debugRef.current);
            if (!bookUsfmResponse.ok) {
                enqueueSnackbar(
                    `${doI18n("pages:core-contenthandler_text_translation:could_not_fetch", i18nRef.current)} ${bookCode}`,
                    { variant: "error" }
                );
                return false;
            }
            const sectionConfig = {
                "showWordAtts": false,
                "showTitles": showTitles,
                "showHeadings": showHeadings,
                "showIntroductions": showIntroductions,
                "showFootnotes": showFootnotes,
                "showXrefs": showXrefs,
                "showParaStyles": showParaStyles,
                "showCharacterMarkup": showCharacterMarkup,
                "showChapterLabels": showChapterLabels,
                "showVersesLabels": showVersesLabels,
                "showFirstVerseLabel": showFirstVerseLabel,
                "nColumns": selectedColumns,
                "showGlossaryStar": false
            }
            const pk = new Proskomma();
            pk.importDocument({
                lang: "xxx",
                abbr: "yyy"
            },
                "usfm",
                bookUsfmResponse.text
            );
            const docId = pk.gqlQuerySync('{documents { id } }').data.documents[0].id;
            const actions = render.sofria2web.renderActions.sofria2WebActions;
            const renderers = render.sofria2web.sofria2html.renderers;
            const cl = new SofriaRenderFromProskomma({ proskomma: pk, actions, debugLevel: 0 })
            const output = {};
            sectionConfig.selectedBcvNotes = ["foo"];
            sectionConfig.renderers = renderers;
            sectionConfig.renderers.verses_label = vn => {
                return `<span class="marks_verses_label">${vn}</span>`;
            };
            cl.renderDocument({ docId, config: sectionConfig, output });
            pdfHtml = pdfTemplate.replace("%%BODY%%", output.paras);
        } else if (pdfType === "bcv") {
            const bcvBibleVerseTemplate = `<section class="verseRecord">
    <span class="cvCol">
        %%CV%%
    </span>
    <span class="verseContent">
        %%VERSECONTENT%%
    </span>
</section>`;
            const bcvBibleTemplate = `%%BODY%%`;
            const bookUrl = `/burrito/ingredient/raw/${repoPath}?ipath=${bookCode}.usfm`;
            const bookUsfmResponse = await getText(bookUrl, debugRef.current);
            if (!bookUsfmResponse.ok) {
                enqueueSnackbar(
                    `${doI18n("pages:core-contenthandler_text_translation:could_not_fetch", i18nRef.current)} ${bookCode}`,
                    { variant: "error" }
                );
                return false;
            }
            const pk = new Proskomma();
            pk.importDocument({
                lang: "xxx",
                abbr: "yyy"
            },
                "usfm",
                bookUsfmResponse.text
            );
            const bookName = getBookName(pk, "xxx_yyy", bookCode);
            const cvTexts = getCVTexts(bookCode, pk);
            const verses = [`<h1>${bookName}</h1>`];
            const seenCvs = new Set([]);
            for (const cvRecord of cvTexts) {
                if (seenCvs.has(cvRecord.cv)) {
                    continue;
                } else {
                    seenCvs.add(cvRecord.cv);
                }
                const chapterVerseSeparator = ":";
                const verseRangeSeparator = "-";
                const verseHtml = bcvBibleVerseTemplate
                    .replace(
                        "%%CV%%",
                        cvRecord.cv
                            .replace(/(\d):/, (match, p1) => `${p1}${chapterVerseSeparator}`)
                            .replace(/(\d)-/, (match, p1) => `${p1}${verseRangeSeparator}`))
                    .replace(
                        '%%VERSECONTENT%%',
                        cvRecord.texts["xxx_yyy"] || "-"
                    );
                verses.push(verseHtml);
            }
            pdfHtml = bcvBibleTemplate
                .replace(
                    "%%TITLE%%",
                    `PDF`
                )
                .replace(
                    "%%BODY%%",
                    verses.join('\n')
                )
                .replace(
                    "%%BOOKNAME%%",
                    bookName
                )
        } else {
            throw new Error(`Unexpected pdfType '${pdfType}'`);
        }

        const textDir = await TextDir(pdfHtml);

        const cssFile = () => {
          if (pdfType === "para") {
            return (textDir === "ltr" ? "/app-resources/pdf/para_bible_page_styles.css" : "/app-resources/pdf/para_bible_page_styles_rtl.css");
          } else {
            return (textDir === "ltr" ? "/app-resources/pdf/bcv_bible_page_styles.css" : "/app-resources/pdf/bcv_bible_page_styles_rtl.css");
          }
        }

        // Extract names of font css files called by the font class
        const parts = adjSelectedFontClass.replace("fonts-", "").split("Pankosmia-");
        const formatPart = (part) => {
            return part.replace(/([a-z])(?=[A-Z])/g, '$1_').replace(/SILSR/g, 'SIL_SR'); // Insert underscores between lowercase and uppercase letters and handle SILSR
        };
        const fontUrlFilenames = parts.map((part) => {
            const formattedPart = formatPart(part);
            return formattedPart ? `/webfonts/pankosmia-${formattedPart}.css` : '';
        }).filter(Boolean); // Remove empty values

        const adjSelectedFontFamiliesStr = adjSelectedFontFamilies.replace(/"/g, "'");

        const openPagedPreviewForPdf = async () => {
          const server = window.location.origin;
          const dirAttr = textDir === 'rtl' ? ' dir="rtl"' : '';
          const contentHtml = `
              <div id="content"${dirAttr} style="font-family: ${adjSelectedFontFamiliesStr};">
                  ${pdfHtml}
              </div>
              <div id="preview-print-host">
                  <button id="preview-print" type="button">${doI18n("pages:core-contenthandler_text_translation:print", i18nRef.current) || 'Print'}</button>
              </div>
              <script>
                  (function(){
                    // Get values passed in to previewWin
                    const getPreviewVal = (name, fallback) => {
                      try {
                        const v = window['__' + name];
                        if (v === undefined || v === null) return fallback;
                        const s = String(v).trim();
                        if (/^__\w+$/.test(s)) return fallback; // Catch absent and "__printButtonText"-like cases
                        return s;
                      } catch (e) { return fallback; }
                    };
                    const BUTTON_TEXT = getPreviewVal('printButtonText', 'Print');
                    const BTN_BG = getPreviewVal('printButtonBackgroundColor', '#1976d2');
                    const BTN_COLOR = getPreviewVal('printButtonColor', '#fff');

                    const win = window;
                    const doc = document;
                    const ID = 'preview-print';
                    const HOST_ID = 'preview-print-host';
                    const STYLE_ID = HOST_ID + '-print-style';
                    const SETUP_FLAG = '_preview_print_setup';

                    const clickHandler = (e) => {
                    e && e.preventDefault();
                    setTimeout(() => {
                      try {
                        if (typeof win.print === 'function') win.print();
                        else if (win.opener && !win.opener.closed) {
                          try { win.opener.postMessage({ type: 'print-request', options: { printBackground: true }, ts: Date.now() }, win.location.origin); } catch (err) {}
                        }
                      } catch (err) {}
                      }, 50);
                    };

                    // Ensure the @media print style exists
                    const ensurePrintHideStyle = () => {
                      if (doc.getElementById(STYLE_ID)) return;
                      const s = doc.createElement('style');
                      s.id = STYLE_ID;
                      s.textContent = '@media print { #preview-print { display: none !important; } }';
                      const host = doc.getElementById(HOST_ID);
                      if (host && host.appendChild) host.appendChild(s);
                      else if (doc.head && doc.head.appendChild) doc.head.appendChild(s);
                      else if (doc.body && doc.body.appendChild) doc.body.appendChild(s);
                      else doc.documentElement.appendChild(s);
                    };

                    // Dedupe helper: keep only one final button after PagedJS re-render
                    const dedupeButtons = () => {
                      const all = Array.from(doc.querySelectorAll('#' + ID));
                      if (all.length <= 1) return;
                      const host = doc.getElementById(HOST_ID);
                      let keeper = all.find(el => host && host.contains(el)) || all[0];
                      if (keeper) {
                        if (keeper._preview_click) keeper.removeEventListener('click', keeper._preview_click);
                        keeper._preview_click = clickHandler;
                        keeper.addEventListener('click', keeper._preview_click);
                        keeper.style.pointerEvents = 'auto';
                        if (host && keeper.parentNode !== host) host.appendChild(keeper);
                      }
                      all.forEach(el => {
                        if (el !== keeper) {
                          try { el.parentNode && el.parentNode.removeChild(el); } catch (e) {}
                        }
                      });
                    };

                    // Create/ensure host + button, attach handler and inline visuals
                    const ensureButtonExists = () => {
                      let host = doc.getElementById(HOST_ID);
                      if (!host) {
                        host = doc.createElement('div');
                        host.id = HOST_ID;
                        host.style.position = 'fixed';
                        host.style.top = '0';
                        host.style.left = '0';
                        host.style.width = '100%';
                        host.style.pointerEvents = 'none';
                        host.style.zIndex = '99999';
                        // If body not present yet, append to documentElement as fallback, observer will move it
                        (doc.body || doc.documentElement).appendChild(host);
                      }
                      ensurePrintHideStyle();

                      let btn = doc.getElementById(ID);
                      if (!btn) {
                        btn = doc.createElement('button');
                        btn.id = ID;
                        btn.type = 'button';
                        btn.textContent = BUTTON_TEXT;
                        btn.style.fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
                        btn.style.backgroundColor = BTN_BG;
                        btn.style.color = BTN_COLOR;
                        btn.style.fontWeight = '500';
                        btn.style.fontSize = '0.875rem';
                        btn.style.letterSpacing = '0.02857em';
                        btn.style.lineHeight = '1.75';
                        btn.style.textTransform = 'uppercase';
                        btn.style.height = '34px';
                        btn.style.cursor = 'pointer';
                        btn.style.border = 'none';
                        btn.style.padding = '0px 8px';
                        btn.style.borderRadius = '17px';
                        btn.style.position = 'fixed';
                        btn.style.top = '8px';
                        btn.style.left = '50%';
                        btn.style.transform = 'translateX(-50%)';
                        btn.style.zIndex = '99999';
                        btn.style.pointerEvents = 'auto';

                        host.appendChild(btn);

                        if (btn._preview_click) btn.removeEventListener('click', btn._preview_click);
                        btn._preview_click = clickHandler;
                        btn.addEventListener('click', btn._preview_click);
                      } else {
                        if (btn._preview_click) btn.removeEventListener('click', btn._preview_click);
                        btn._preview_click = clickHandler;
                        btn.addEventListener('click', btn._preview_click);
                        btn.style.pointerEvents = 'auto';
                        if (host && btn.parentNode !== host) host.appendChild(btn);
                      }

                      dedupeButtons();
                      return btn;

                    };

                    // Ensure routine
                    const ensureAll = () => {
                      try {
                        if (doc[SETUP_FLAG]) return;
                        ensureButtonExists();
                        try { win.addEventListener('afterprint', () => { try { win.close(); } catch (e) {} }); } catch (e) {}
                        doc[SETUP_FLAG] = true;
                      } catch (e) {}
                    };

                    // MutationObserver to recreate missing pieces and dedupe duplicate from PagedJS re-render
                    const startObserver = () => {
                      const mo = new win.MutationObserver(() => {
                        if (!doc.getElementById(STYLE_ID)) ensurePrintHideStyle();
                        if (!doc.getElementById(HOST_ID) || !doc.getElementById(ID)) ensureButtonExists();
                        dedupeButtons();
                      });
                      mo.observe(doc.documentElement || doc, { childList: true, subtree: true });
                    };

                    ensureAll();
                    startObserver();
                    setTimeout(() => { ensureAll(); dedupeButtons(); }, 50);
                  })();
                </script>
          `;

          const openFn = (url => window.open(url, '_blank'));
          const previewWin = openFn('about:blank');
          if (!previewWin) return; // window.open failed or was blocked
          try {
             void previewWin.document; // attempt to read document property
          } catch (e) {
            return; // window currently inaccessible (e.g., not yet initialized or cross‑origin)
          }
          // Pass values to previewWin
          previewWin.__printButtonText = doI18n("pages:core-contenthandler_text_translation:print", i18nRef.current);
          previewWin.__printButtonBackgroundColor = theme.palette.primary.main;
          previewWin.__printButtonColor = theme.palette.primary.contrastText;

          // Initial Content
          previewWin.document.open();
          previewWin.document.write(contentHtml);
          previewWin.document.close();

          // Ensure head exists
          if (!previewWin.document.head) {
            const head = previewWin.document.createElement('head');
            previewWin.document.documentElement.insertBefore(head, previewWin.document.documentElement.firstChild);
          }

          // Set the page title.
          previewWin.document.title = doI18n("pages:core-contenthandler_text_translation:pdf_preview", i18nRef.current);

          // Wait until document.body is present, retrying until body exists or timeout.
          const waitForBody = (win, timeout = 3000) => {
            return new Promise((resolve, reject) => {
              const start = Date.now();
              const check = () => {
                try {
                  if (win.document && win.document.body) return resolve();
                } catch (e) {
                    // Access may throw while the new window is not ready or is cross-origin; Retry until timeout.
                }
                if (Date.now() - start > timeout) return reject(new Error('preview body timeout'));
                setTimeout(check, 25);
              };
              check();
            });
          };
          await waitForBody(previewWin);

          // Append PagedJS
          const script = previewWin.document.createElement('script');
          script.src = `${server}/app-resources/pdf/paged.polyfill.js`;
          previewWin.document.head.appendChild(script);

          const loadStyles = (href) => {
              const link = previewWin.document.createElement('link');
              link.rel = "stylesheet";
              link.href = href;
              previewWin.document.head.appendChild(link);
          };

          // Load styles
          loadStyles(`${server}${cssFile()}`);
          fontUrlFilenames.forEach(loadStyles);

        };

        openPagedPreviewForPdf();

        return true;
    }

    const handleBooksChange = (event) => {
        setSelectedBooks(event.target.value);
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

    const [anchorEl, setAnchorEl] = useState(null);
    const openAnchor = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
        setOpen(false);
        setTimeout(() => {
            window.location.href = '/clients/content';
        }, 500);
    };

    const handleCloseColumns = () => {
        setAnchorEl(null);
    };


    function columnIcon(selectedColumns) {
        let content;

        switch (selectedColumns) {
            case 1:
                content = <LooksOneOutlinedIcon color='primary' />;
                break;
            case 2:
                content = <LooksTwoOutlinedIcon color='primary' />;
                break;
            case 3:
                content = <Looks3OutlinedIcon color='primary' />;
                break;
            default:
                content = <LooksTwoOutlinedIcon color='primary' />;
        }

        return content;
    }

    // Use the number of books in select to calculate minimum dialog height
    const calculateDialogHeight = (numBooks) => {
        const itemHeight = 48; // Approximate height of each MenuItem
        const maxDropdownHeight = 224; // Maximum height of the dropdown as set in its MenuProps
        const dropdownHeight = Math.min(numBooks * itemHeight, maxDropdownHeight);
        return dropdownHeight + 211; // Space for title, actions, and padding
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
                open={open}
                onClose={handleClose}
                slotProps={{
                    paper: {
                        component: 'form',
                        style: {
                            minWidth: '250px',
                            minHeight: calculateDialogHeight(bookNames.length),
                        },
                    },
                }}
                sx={{
                    backdropFilter: "blur(3px)",
                }}
            >
                <AppBar color='secondary' sx={{ position: 'relative', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                    <Toolbar>
                        <Typography variant="h6" component="div">
                            {doI18n("pages:core-contenthandler_text_translation:generate_as_pdf", i18nRef.current)}
                        </Typography>
                    </Toolbar>
                </AppBar>
                <DialogContent sx={{ mt: 1, pt: 0 }}>
                    <DialogContentText>
                        <Typography>
                            {doI18n("pages:core-contenthandler_text_translation:pick_one_book_export", i18nRef.current)}
                        </Typography>
                    </DialogContentText>
                    <FormControl fullWidth>
                        <Select
                            variant="standard"
                            displayEmpty
                            defaultOpen={true}
                            value={selectedBooks}
                            onChange={handleBooksChange}
                            input={<OutlinedInput />}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 224,
                                        minWidth: 250,
                                    },
                                },
                            }}
                            renderValue={selected => {
                                if (!selected) {
                                    return <em>{doI18n("pages:content:books", i18nRef.current)}</em>;
                                }
                                fileExport.current = selected;
                                return doI18n(`scripture:books:${selected}`, i18nRef.current);
                            }}
                            inputProps={{ 'aria-label': 'Without label' }}
                        >
                            {bookCodes.filter(item => bookNames.includes(item)).map((bookName) => (
                                <MenuItem
                                    key={bookName}
                                    value={bookName}
                                >
                                    {`${bookName} - ` + doI18n(`scripture:books:${bookName}`, i18nRef.current)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {selectedBooks &&
                        <DialogContentText>
                            <List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>
                                <ListItem disablePadding >
                                    <ListItemIcon>
                                        <ViewHeadlineOutlinedIcon color='primary' />
                                    </ListItemIcon>
                                    <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_by_verse", i18nRef.current)} />
                                    <Switch
                                        edge='end'
                                        onChange={() => setShowByVerse(!showByVerse)}
                                        checked={showByVerse}
                                    >
                                    </Switch>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowTitles(!showTitles)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showTitles} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_title", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowHeadings(!showHeadings)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showHeadings} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_headings", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowIntroductions(!showIntroductions)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showIntroductions} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_introductions", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowFootnotes(!showFootnotes)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showFootnotes} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_footnotes", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowXrefs(!showXrefs)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showXrefs} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_xrefs", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowParaStyles(!showParaStyles)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showParaStyles} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_para_styles", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowCharacterMarkup(!showCharacterMarkup)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showCharacterMarkup} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_character_markup", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowChapterLabels(!showChapterLabels)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showChapterLabels} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_chapter_labels", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowVersesLabels(!showVersesLabels)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showVersesLabels} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_verses_labels", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton onClick={() => setShowFirstVerseLabel(!showFirstVerseLabel)} disabled={showByVerse} dense>
                                        <ListItemIcon>
                                            <Checkbox edge="start" checked={showFirstVerseLabel} tabIndex={-1} disableRipple />
                                        </ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:show_first_verse_label", i18nRef.current)} />
                                    </ListItemButton>
                                </ListItem>
                                <ListItem disablePadding >
                                    <ListItemButton
                                        id="basic-button"
                                        aria-controls={openAnchor ? 'basic-menu' : undefined}
                                        aria-haspopup="true"
                                        aria-expanded={openAnchor ? 'true' : undefined}
                                        onClick={handleClick}
                                        disabled={showByVerse}
                                        dense
                                    >
                                        <ListItemIcon>{columnIcon(selectedColumns)}</ListItemIcon>
                                        <ListItemText primary={doI18n("pages:core-contenthandler_text_translation:number_of_columns", i18nRef.current)} />
                                    </ListItemButton>
                                    <Menu
                                        id="basic-menu"
                                        anchorEl={anchorEl}
                                        open={openAnchor}
                                        onClose={handleCloseColumns}
                                    >
                                        <MenuItem onClick={() => { setSelectedColumns(1); handleCloseColumns() }}>1</MenuItem>
                                        <MenuItem onClick={() => { setSelectedColumns(2); handleCloseColumns() }}>2</MenuItem>
                                        <MenuItem onClick={() => { setSelectedColumns(3); handleCloseColumns() }}>3</MenuItem>
                                    </Menu>
                                </ListItem>
                            </List>
                        </DialogContentText>
                    }
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="text"
                        color="primary"
                        onClick={() => {
                            handleClose()
                            setSelectedBooks(null);
                        }}
                    >
                        {doI18n("pages:content:cancel", i18nRef.current)}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!selectedBooks}
                        onClick={() => {
                            if (!fileExport.current) {
                                enqueueSnackbar(
                                    doI18n("pages:core-contenthandler_text_translation:no_books_selected", i18nRef.current),
                                    { variant: "warning" }
                                );
                            } else {
                                generatePdf(fileExport.current, showByVerse ? "bcv" : "para").then();
                            }
                            handleCloseCreate();
                        }}
                    >{doI18n("pages:core-contenthandler_text_translation:export_label", i18nRef.current)}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default PdfGenerate;
