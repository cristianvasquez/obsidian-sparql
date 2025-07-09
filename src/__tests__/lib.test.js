import {sum} from '../lib.js'
import {expect, test} from "@jest/globals";

test('sums', () => {
    expect(sum(1, 2)).toStrictEqual(3);
});