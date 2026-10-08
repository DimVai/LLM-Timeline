(() => {
    'use strict';

    const copy = {
        el: {
            skip: 'Μετάβαση στο timeline', timeline: 'Χρονολόγιο', language: 'Γλώσσα',
            intro: 'Οι στιγμές που άλλαξαν τον τρόπο που χρησιμοποιούμε την τεχνητή νοημοσύνη.',
            explore: 'Ακολούθησε την εξέλιξη', yearNavigation: 'Πλοήγηση ανά έτος',
            timelineLabel: 'Γεγονότα του timeline', year: 'Έτος', milestones: 'Σημαντικά γεγονότα',
            entities: 'Μοντέλα & πλατφόρμες', loading: 'Φόρτωση του timeline…',
            footer: 'Μια διαδρομή που συνεχίζεται.', backToTop: 'Στην αρχή',
            details: 'Σημειώσεις & πηγές', related: 'Συναφής γεννητική AI',
            important: 'Σημαντικό ορόσημο',
            source: 'Πηγή', event: 'γεγονός', events: 'γεγονότα', milestoneCount: 'ορόσημα',
            englishPending: 'Η αγγλική μετάφραση θα προστεθεί σύντομα',
            languageChanged: 'Το περιεχόμενο εμφανίζεται στα ελληνικά.',
            loadError: 'Δεν ήταν δυνατή η φόρτωση του timeline.',
            localFile: 'Άνοιξε τη σελίδα μέσω τοπικού HTTP server για να φορτωθεί το αρχείο δεδομένων.',
            retry: 'Δοκίμασε ξανά',
            dates: {
                publication: 'Δημοσίευση', public_release: 'Δημόσια διάθεση',
                general_availability: 'Γενική διαθεσιμότητα', public_preview: 'Δημόσια δοκιμαστική έκδοση',
                public_rollout: 'Σταδιακή διάθεση', practical_use: 'Πρακτική χρήση',
                documented_availability: 'Τεκμηριωμένη διαθεσιμότητα'
            }
        },
        en: {
            skip: 'Skip to timeline', timeline: 'Timeline', language: 'Language',
            intro: 'The moments that changed the way we use artificial intelligence.',
            explore: 'Follow the evolution', yearNavigation: 'Navigate by year',
            timelineLabel: 'Timeline events', year: 'Year', milestones: 'Key milestones',
            entities: 'Models & platforms', loading: 'Loading the timeline…',
            footer: 'A story still unfolding.', backToTop: 'Back to top',
            details: 'Notes & sources', related: 'Related generative AI',
            important: 'Major milestone',
            source: 'Source', event: 'event', events: 'events', milestoneCount: 'milestones',
            englishPending: 'The English translation is coming soon',
            languageChanged: 'Content is now displayed in English.',
            loadError: 'The timeline could not be loaded.',
            localFile: 'Open this page through a local HTTP server to load the data file.',
            retry: 'Try again',
            dates: {
                publication: 'Publication', public_release: 'Public release',
                general_availability: 'General availability', public_preview: 'Public preview',
                public_rollout: 'Gradual rollout', practical_use: 'Practical use',
                documented_availability: 'Documented availability'
            }
        }
    };

    const content = document.getElementById('timeline-content');
    const yearLinks = document.getElementById('year-links');
    const status = document.getElementById('load-status');
    let data;
    let language = 'el';
    let availableLanguages = ['el'];
    let yearGroups = [];
    let scrollQueued = false;

    const t = (key) => copy[language][key];
    const localized = (value) => value?.[language] ?? value?.[data.defaultLanguage] ?? '';

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function hasTranslation(locale) {
        return Boolean(data.title?.[locale]) && data.eras.every((era) =>
            Boolean(era.title?.[locale]) && Boolean(era.description?.[locale]) &&
            era.years.every((year) => year.events.every((event) =>
                Boolean(event.title?.[locale]) && Boolean(event.description?.[locale]) &&
                (!(event.notes?.[data.defaultLanguage]?.length) ||
                    (Array.isArray(event.notes?.[locale]) &&
                     event.notes[locale].length === event.notes[data.defaultLanguage].length &&
                     event.notes[locale].every((note) => typeof note === 'string' && note.trim())))
            ))
        );
    }

    function updateInterface() {
        document.documentElement.lang = language;
        document.querySelectorAll('[data-i18n]').forEach((node) => {
            node.textContent = t(node.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
            node.setAttribute('aria-label', t(node.dataset.i18nAria));
        });
        document.querySelectorAll('[data-language]').forEach((button) => {
            const locale = button.dataset.language;
            button.disabled = !data || !availableLanguages.includes(locale);
            button.setAttribute('aria-pressed', String(locale === language));
            button.title = locale === 'en' && button.disabled ? t('englishPending') : '';
        });
        document.querySelector('meta[name="description"]').content = t('intro');
        if (!data) return;
        const title = localized(data.title);
        document.title = title;
        const heading = document.getElementById('site-title');
        heading.replaceChildren();
        title.split(/(LLM)/g).forEach((part) => {
            heading.append(part === 'LLM' ? element('span', '', part) : document.createTextNode(part));
        });
    }

    function formatDate(date) {
        const [year, month, day] = date.split('-').map(Number);
        if (!month) return String(year);
        const options = { year: 'numeric', month: 'long', timeZone: 'UTC' };
        if (day) options.day = 'numeric';
        return new Intl.DateTimeFormat(language === 'el' ? 'el-GR' : 'en-GB', options)
            .format(new Date(Date.UTC(year, month - 1, day || 1)));
    }

    function createDetails(event) {
        const details = element('details', 'event-details');
        details.dataset.eventId = event.id;
        details.append(element('summary', '', t('details')));
        const body = element('div', 'detail-body');
        const dateLine = element('p', 'event-date');
        const time = element('time', '', formatDate(event.date));
        time.dateTime = event.date;
        dateLine.append(`${copy[language].dates[event.dateType] ?? t('year')} · `, time);
        body.append(dateLine);
        const notes = localized(event.notes);
        if (Array.isArray(notes) && notes.length) {
            const list = element('ul', 'event-notes');
            notes.forEach((note) => list.append(element('li', '', note)));
            body.append(list);
        }
        if (event.sources?.length) {
            const sources = element('div', 'sources');
            event.sources.forEach((source, index) => {
                let url;
                try { url = new URL(source); } catch { return; }
                if (!['https:', 'http:'].includes(url.protocol)) return;
                const link = element('a', '', `${t('source')} ${index + 1} ↗`);
                link.href = url.href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.title = url.hostname;
                link.setAttribute('aria-label', `${t('source')} ${index + 1}: ${url.hostname}`);
                sources.append(link);
            });
            body.append(sources);
        }
        details.append(body);
        return details;
    }

    function createEvent(event) {
        const row = element('li', 'event');
        row.id = event.id;
        const text = element('div', 'event-copy');
        if (event.important === true) {
            row.classList.add('event-important');
            text.append(element('span', 'category-tag important-tag', t('important')));
        }
        if (event.category === 'related_generative_ai') {
            text.append(element('span', 'category-tag', t('related')));
        }
        text.append(element('h4', 'event-title', localized(event.title)));
        text.append(element('p', 'event-description', localized(event.description)));
        text.append(createDetails(event));
        const entities = element('div', 'event-entities');
        entities.setAttribute('aria-label', t('entities'));
        (event.entities ?? []).forEach((entity) => {
            const item = element('div', 'entity');
            item.append(element('span', 'entity-organization', entity.organization));
            item.append(element('span', 'entity-name', entity.name));
            entities.append(item);
        });
        row.append(text, entities);
        return row;
    }

    function renderTimeline() {
        const fragment = document.createDocumentFragment();
        const years = new Set();
        let count = 0;
        // Preserve the editorial era order, including the shared 2024 boundary.
        data.eras.forEach((era) => {
            const band = element('section', 'era');
            const intro = element('header', 'era-intro container');
            const title = element('h2', 'era-title', localized(era.title));
            title.id = `era-${era.id}-title`;
            band.setAttribute('aria-labelledby', title.id);
            intro.append(title, element('p', 'era-description', localized(era.description)));
            band.append(intro);
            [...era.years].sort((a, b) => a.year - b.year).forEach((year) => {
                const group = element('section', 'year-group container');
                group.id = years.has(year.year) ? `year-${year.year}-${era.id}` : `year-${year.year}`;
                group.dataset.year = String(year.year);
                const heading = element('h3', 'year-heading');
                heading.id = `${group.id}-heading`;
                group.setAttribute('aria-labelledby', heading.id);
                const headingInner = element('span', 'year-heading-inner', year.year);
                headingInner.append(element('span', 'year-count', `${year.events.length} ${t(year.events.length === 1 ? 'event' : 'events')}`));
                heading.append(headingInner);
                const list = element('ul', 'event-list');
                // Exact dates first; year-only entries keep their supplied order at the end.
                const events = [...year.events].sort((a, b) => {
                    const aDate = a.date.length === 4 ? `${a.date}-99` : a.date;
                    const bDate = b.date.length === 4 ? `${b.date}-99` : b.date;
                    return aDate.localeCompare(bDate);
                });
                events.forEach((event) => list.append(createEvent(event)));
                group.append(heading, list);
                band.append(group);
                years.add(year.year);
                count += events.length;
            });
            fragment.append(band);
        });
        content.replaceChildren(fragment);
        const sortedYears = [...years].sort((a, b) => a - b);
        yearLinks.replaceChildren(...sortedYears.map((year) => {
            const link = element('a', '', year);
            link.href = `#year-${year}`;
            link.dataset.year = String(year);
            return link;
        }));
        document.getElementById('timeline-stats').textContent = sortedYears.length
            ? `${sortedYears[0]}—${sortedYears.at(-1)} · ${count} ${t('milestoneCount')}` : '';
        yearGroups = [...content.querySelectorAll('.year-group')];
        updateActiveYear();
    }

    function stickyOffset() {
        return document.getElementById('page-header').offsetHeight +
            document.querySelector('.year-navigation').offsetHeight + 30;
    }

    function updateActiveYear() {
        scrollQueued = false;
        let active = yearGroups[0];
        const offset = stickyOffset();
        for (const group of yearGroups) {
            if (group.getBoundingClientRect().top > offset) break;
            active = group;
        }
        yearLinks.querySelectorAll('a').forEach((link) => {
            if (link.dataset.year === active?.dataset.year) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
        });
    }

    function changeLanguage(locale) {
        if (!data || locale === language || !availableLanguages.includes(locale)) return;
        const offset = stickyOffset();
        const anchor = [...content.querySelectorAll('.event')].find((row) => row.getBoundingClientRect().bottom > offset);
        const anchorTop = anchor?.getBoundingClientRect().top;
        const expanded = new Set([...content.querySelectorAll('details[open]')].map((node) => node.dataset.eventId));
        language = locale;
        updateInterface();
        renderTimeline();
        content.querySelectorAll('details').forEach((node) => { node.open = expanded.has(node.dataset.eventId); });
        if (anchor && window.scrollY > document.getElementById('timeline').offsetTop - offset) {
            const next = document.getElementById(anchor.id);
            window.scrollBy({ top: next.getBoundingClientRect().top - anchorTop, behavior: 'instant' });
        }
        updateActiveYear();
        document.getElementById('language-status').textContent = t('languageChanged');
    }

    async function loadTimeline() {
        status.textContent = t('loading');
        try {
            const response = await fetch('timeline/timeline.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            if (!Array.isArray(payload.eras)) throw new Error('Missing eras');
            data = payload;
            availableLanguages = Object.keys(copy).filter(hasTranslation);
            language = availableLanguages.includes(data.defaultLanguage) ? data.defaultLanguage : 'el';
            updateInterface();
            renderTimeline();
            status.textContent = '';
            if (location.hash) {
                let id;
                try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
                document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
            }
        } catch {
            status.textContent = location.protocol === 'file:' ? `${t('loadError')} ${t('localFile')}` : t('loadError');
            const retry = element('button', 'retry-button', t('retry'));
            retry.type = 'button';
            retry.addEventListener('click', loadTimeline);
            status.append(retry);
        }
    }

    document.addEventListener('click', (event) => {
        const button = event.target.closest('[data-language]');
        if (button && !button.disabled) changeLanguage(button.dataset.language);
    });
    window.addEventListener('scroll', () => {
        if (!scrollQueued) {
            scrollQueued = true;
            requestAnimationFrame(updateActiveYear);
        }
    }, { passive: true });
    window.addEventListener('resize', updateActiveYear);
    updateInterface();
    loadTimeline();
})();
