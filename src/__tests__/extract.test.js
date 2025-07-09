import {extract_current,extract_all} from '../extract.js'
import {expect, test} from "@jest/globals";

test('extracts code fence', () => {
    const src = `
Some text
\`\`\`turtle
<#green-goblin>
    rel:enemyOf <#spiderman> ;
    a foaf:Person ;    # in the context of the Marvel universe
    foaf:name "Green Goblin" .
\`\`\`
More text
`

    const hit = {
        "begin": 2,
        "end": 7,
        "lang": "turtle",
        "text": `<#green-goblin>
    rel:enemyOf <#spiderman> ;
    a foaf:Person ;    # in the context of the Marvel universe
    foaf:name "Green Goblin" .`
    }

    expect(extract_current(src, 1)).toStrictEqual(null);
    expect(extract_current(src, 2)).toStrictEqual(hit);
    expect(extract_current(src, 3)).toStrictEqual(hit);
    expect(extract_current(src, 4)).toStrictEqual(hit);
    expect(extract_current(src, 5)).toStrictEqual(hit);
    expect(extract_current(src, 6)).toStrictEqual(hit);
    expect(extract_current(src, 7)).toStrictEqual(hit);
    expect(extract_current(src, 8)).toStrictEqual(null);
});


test('extracts all', () => {
    const src = `
Some text

Some turtle

\`\`\`turtle
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
\`\`\`

An unsupported fence

\`\`\`sh
echo 'hello world'
\`\`\`

More turtle

\`\`\`turtle
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
\`\`\`
`

    const hit = [
        {
            lang: 'turtle',
            text: '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .',
            begin: 5,
            end: 7
        },
        {
            lang: 'turtle',
            text: '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .',
            begin: 17,
            end: 19
        }
    ]


    expect(extract_all(src)).toStrictEqual(hit);
});