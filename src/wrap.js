function wrapLine(line, width, comment_prefix) {
  let wrapped = "";

  let rest = line;
  while (rest.length > width) {
    const wrap_at = findWrapPosition(width, rest, comment_prefix);
    if (!wrap_at) {
      break;
    }
    wrapped += (wrapped ? "\n" : "") + rest.slice(0, wrap_at);
    // Since we only wrap at a whitespace, it's safe to "+1"
    // to avoid it on the next line
    rest = rest.slice(wrap_at + 1);
  }

  return wrapped + (wrapped ? "\n" : "") + rest;
}

function findWrapPosition(width, line, comment_prefix) {
  for (let i = width; i > 0; i--) {
    const char = line.charAt(i);
    if (char === " " && line.charAt(i + 1) !== comment_prefix) return i;
  }

  return 0;
}

export default function wrap(text, width, comment_prefix) {
  let wrapped = "";
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (i !== 0) wrapped += "\n";
    const line = lines[i];
    if (line.startsWith(comment_prefix)) wrapped += line;
    else if (line.length <= width) wrapped += line;
    else wrapped += wrapLine(line, width, comment_prefix);
  }

  return wrapped;
}
