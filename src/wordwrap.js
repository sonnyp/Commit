// This software is released under the MIT license:

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

export default function wordwrap (start, stop, params) {
    if (typeof start === 'object') {
        params = start;
        start = params.start;
        stop = params.stop;
    }

    if (typeof stop === 'object') {
        params = stop;
        start = start || params.start;
        stop = undefined;
    }

    if (!stop) {
        stop = start;
        start = 0;
    }

    if (!params) params = {};
    var mode = params.mode || 'soft';
    var re = mode === 'hard' ? /\b/ : /(\S+\s+)/;

    return function (text) {
        var chunks = text.toString()
            .split(re)
            .reduce(function (acc, x) {
                if (mode === 'hard') {
                    for (var i = 0; i < x.length; i += stop - start) {
                        acc.push(x.slice(i, i + stop - start));
                    }
                }
                else acc.push(x)
                return acc;
            }, [])
        ;

        return chunks.reduce(function (lines, rawChunk) {
            if (rawChunk === '') return lines;

            var chunk = rawChunk.replace(/\t/g, '    ');

            var i = lines.length - 1;
            if (lines[i].length + chunk.length > stop) {
                lines[i] = lines[i].replace(/\s+$/, '');

                chunk.split(/\n/).forEach(function (c) {
                    lines.push(
                        new Array(start + 1).join(' ')
                        + c.replace(/^\s+/, '')
                    );
                });
            }
            else if (chunk.match(/\n/)) {
                var xs = chunk.split(/\n/);
                lines[i] += xs.shift();
                xs.forEach(function (c) {
                    lines.push(
                        new Array(start + 1).join(' ')
                        + c.replace(/^\s+/, '')
                    );
                });
            }
            else {
                lines[i] += chunk;
            }

            return lines;
        }, [ new Array(start + 1).join(' ') ]).join('\n');
    };
};
