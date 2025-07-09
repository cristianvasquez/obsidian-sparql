import {test} from "@jest/globals";
import graphy from 'graphy';

const ttl_read = graphy.content.ttl.read;
const nt_scan = graphy.content.nt.scan;


test('test nt_scan', () => {

// create the scanner instancemkdir
    nt_scan(process.stdin, {
        // use the 'scribe' preset
        preset: 'scribe',

        // 'db_chunk' will be a Buffer in this preset, simply write it to stdout
        update(db_chunk) {
            // process.stdout.write(db_chunk);
            console.log(db_chunk)
        },

        // this will fire once the scanner is done
        report() {
            // do stuff...
        },
    })


});


test('test ttl_read', () => {

    ttl_read(`
    @prefix foaf: <http://xmlns.com/foaf/0.1/> .

    <#spiderman> a foaf:Person ;
    a foaf:Araña ;
        foaf:name "Spiderman" .
`, {
        // whew! simplified inline events style  ;)
        data(y_quad) {
            console.dir(y_quad);
        },

        eof(h_prefixes) {
            console.log('done!');
        },
    })

});