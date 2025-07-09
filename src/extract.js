const VARIANTS = {
    'turtle/rdf': {
        lang: 'turtle',
    },
    'turtle': {
        lang: 'turtle',
    },
};

function extract(lines, lineNumber, variants = VARIANTS) {

    let begin = null
    let end = null
    let lang = null

    function equals(line, target) {
        let str = line.trim()
        return str.toUpperCase() === target.toUpperCase();
    }

    /**
     * if it's the start of a supported fence, return the language.
     * @param line
     */

    function fenceOpeningWithKey(line) {
        for (let key of Object.keys(variants)) {
            if (equals(line, '```' + key)) {
                return key
            }
        }
        return null
    }

    for (let i = lineNumber; i >= 0; i--) {
        let key = fenceOpeningWithKey(lines[i])
        if (key) {
            begin = i;
            lang = key
            break
        } else if (i !== lineNumber && equals(lines[i], '```')) {
            begin = null
            lang = null
            break
        }
    }

    for (let i = lineNumber; i < lines.length; i++) {
        if (i !== begin && equals(lines[i], '```')) {
            end = i;
            break
        }
    }

    if ((begin != null) && (end != null)) {
        return {
            lang: lang,
            text: lines.slice(begin + 1, end).join('\n'),
            begin: begin,
            end: end,
        };
    }
    return null

}

/**
 * Extracts everything that is a supported fence.
 * @param src
 * @param variants
 */
function extract_all(src, variants = VARIANTS) {
    let lines = src.split('\n')
    let result = []
    for (let i = 0; i < lines.length; i++) {
        let current = extract(lines, i, variants)
        if (current) {
            i = current.end + 1
            result.push(current)
        }
    }
    return result
}

/**
 * extracts the contents of a fence ar a certain line
 * @param src
 * @param lineNumber
 * @param variants
 */
function extract_current(src, lineNumber, variants = VARIANTS) {
    let lines = src.split('\n')
    return extract(lines, lineNumber, variants)
}


export {extract_all, extract_current, VARIANTS}