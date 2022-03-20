import "./setup.js";

import { test } from "./uvu.js";
import * as assert from "./assert.js";
import GLib from "gi://GLib";

import wrap from "../src/wrap.js";

const loop = GLib.MainLoop.new(null, false);
test.after(() => {
  loop.quit();
});

test("preserves newlines", () => {
  assert.is(wrap("hello\nworld", 100, "#"), "hello\nworld");
  assert.is(wrap(`\nhello\nworld\n`, 100, "#"), `\nhello\nworld\n`);
  assert.is(wrap(`hello\nworld\n`, 100, "#"), `hello\nworld\n`);
  assert.is(wrap(`\nhello\nworld`, 100, "#"), `\nhello\nworld`);
});

test("does not wrap if there is no whitespace", () => {
  assert.is(wrap(`idonthaveanywhitespace`, 6, "#"), `idonthaveanywhitespace`);
});

test("does not wrap lines starting with comment_prefix", () => {
  assert.is(wrap(`# please don't wrap me`, 4, "#"), `# please don't wrap me`);
});

test("wraps at the closest whitespace", () => {
  assert.is(wrap(`hello world`, 6, "#"), `hello\nworld`);
  assert.is(wrap(`hello world`, 5, "#"), `hello\nworld`);
  assert.is(
    wrap(
      `hello world this is a very long message, let's see what happens`,
      10,
      "#",
    ),
    `hello\nworld this\nis a very\nlong\nmessage,\nlet's see\nwhat\nhappens`,
  );
});

test("does not wrap at the commit_prefix", () => {
  const str = `I should not be wrapped at a #word starting with commit prefix or it will become a comment`;
  assert.is(
    wrap(str, str.indexOf("#"), "#"),
    "I should not be wrapped at\na #word starting with commit\nprefix or it will become a\ncomment",
  );
  assert.is(wrap("1234567890#1234567890", 10, "#"), "1234567890#1234567890");
});

test.run();
loop.run();
