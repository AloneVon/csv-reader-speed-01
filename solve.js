// Fast drop-in for make.fun's csv-reader 1.0.0.
const C_COMMA = 44;
const C_QUOTE = 34;
const C_LF = 10;
const C_CR = 13;
const C_BOM = 0xfeff;
const END = 0;
const COMMA = 1;
const LINE_BREAK = 2;

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const len = text.length;
  const buf = Buffer.from(text, 'utf16le');
  const u = new Uint16Array(buf.buffer, buf.byteOffset, len);
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;
  let pos = 0;
  let line = 1;
  if (pos < len && u[pos] === C_BOM) pos += 1;

  let recordLine = 1;
  let recordRow = null;
  let fieldValue = '';
  let fieldEnded = END;
  let fieldAdded = 0;

  function error(code) {
    errors.push({ code, line: recordLine, row: recordRow });
  }

  // Slow path: a stray CR, a quote's junk suffix, or a failed quoted field.
  function readUnquotedSlow(prefix) {
    let value = prefix;
    let added = 0;
    while (true) {
      const start = pos;
      while (pos < len) {
        const c = u[pos];
        if (c === C_COMMA || c === C_LF || c === C_CR) break;
        pos += 1;
      }
      if (pos > start) {
        value += text.slice(start, pos);
        added += pos - start;
      }
      if (pos >= len) {
        fieldValue = value;
        fieldEnded = END;
        fieldAdded = added;
        return;
      }
      const c = u[pos];
      if (c === C_COMMA) {
        pos += 1;
        fieldValue = value;
        fieldEnded = COMMA;
        fieldAdded = added;
        return;
      }
      if (c === C_LF) {
        pos += 1;
        line += 1;
        fieldValue = value;
        fieldEnded = LINE_BREAK;
        fieldAdded = added;
        return;
      }
      if (u[pos + 1] === C_LF) {
        pos += 2;
        line += 1;
        fieldValue = value;
        fieldEnded = LINE_BREAK;
        fieldAdded = added;
        return;
      }
      error('stray_cr');
      pos += 1;
    }
  }

  while (pos < len) {
    // Lines with no characters are no records.
    while (pos < len) {
      const c = u[pos];
      if (c === C_LF) {
        pos += 1;
        line += 1;
      } else if (c === C_CR && pos + 1 < len && u[pos + 1] === C_LF) {
        pos += 2;
        line += 1;
      } else {
        break;
      }
    }
    if (pos >= len) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let fieldCount = 0;
    let quoted = false;
    do {
      const first = u[pos];
      if (first === C_QUOTE) {
        quoted = true;
        const open = pos;
        const openLine = line;
        let start = open + 1;
        let value = '';
        let touched = false;
        let i = start;
        let closed = false;
        while (i < len) {
          while (i + 3 < len) {
            let c = u[i];
            if (c === C_QUOTE || c === C_LF || c === C_CR) break;
            c = u[i + 1];
            if (c === C_QUOTE || c === C_LF || c === C_CR) {
              i += 1;
              break;
            }
            c = u[i + 2];
            if (c === C_QUOTE || c === C_LF || c === C_CR) {
              i += 2;
              break;
            }
            c = u[i + 3];
            if (c === C_QUOTE || c === C_LF || c === C_CR) {
              i += 3;
              break;
            }
            i += 4;
          }
          if (i >= len) break;
          const c = u[i];
          if (c === C_QUOTE) {
            if (i + 1 < len && u[i + 1] === C_QUOTE) {
              if (touched) value += text.slice(start, i);
              else value = text.slice(start, i);
              value += '"';
              touched = true;
              i += 2;
              start = i;
              continue;
            }
            if (touched) value += text.slice(start, i);
            else value = text.slice(start, i);
            pos = i + 1;
            closed = true;
            break;
          }
          if (c === C_LF) {
            line += 1;
            i += 1;
          } else if (c === C_CR) {
            if (touched) value += text.slice(start, i);
            else value = text.slice(start, i);
            value += '\n';
            touched = true;
            line += 1;
            if (i + 1 < len && u[i + 1] === C_LF) i += 2;
            else i += 1;
            start = i;
          } else {
            i += 1;
          }
        }
        if (!closed) {
          pos = open + 1;
          line = openLine;
          error('unterminated_quote');
          readUnquotedSlow('"');
        } else {
          fieldValue = value;
          if (pos >= len) {
            fieldEnded = END;
          } else {
            const c = u[pos];
            if (c === C_COMMA) {
              pos += 1;
              fieldEnded = COMMA;
            } else if (c === C_LF) {
              pos += 1;
              line += 1;
              fieldEnded = LINE_BREAK;
            } else if (c === C_CR && pos + 1 < len && u[pos + 1] === C_LF) {
              pos += 2;
              line += 1;
              fieldEnded = LINE_BREAK;
            } else {
              readUnquotedSlow(value);
              if (fieldAdded > 0) error('quote_junk');
            }
          }
        }
      } else {
        quoted = false;
        const start = pos;
        while (pos + 3 < len) {
          let c = u[pos];
          if (c === C_COMMA || c === C_LF || c === C_CR) break;
          c = u[pos + 1];
          if (c === C_COMMA || c === C_LF || c === C_CR) {
            pos += 1;
            break;
          }
          c = u[pos + 2];
          if (c === C_COMMA || c === C_LF || c === C_CR) {
            pos += 2;
            break;
          }
          c = u[pos + 3];
          if (c === C_COMMA || c === C_LF || c === C_CR) {
            pos += 3;
            break;
          }
          pos += 4;
        }
        while (pos < len) {
          const c = u[pos];
          if (c === C_COMMA || c === C_LF || c === C_CR) break;
          pos += 1;
        }
        fieldValue = pos === start ? '' : text.slice(start, pos);
        if (pos >= len) {
          fieldEnded = END;
        } else {
          const c = u[pos];
          if (c === C_COMMA) {
            pos += 1;
            fieldEnded = COMMA;
          } else if (c === C_LF) {
            pos += 1;
            line += 1;
            fieldEnded = LINE_BREAK;
          } else if (u[pos + 1] === C_LF) {
            pos += 2;
            line += 1;
            fieldEnded = LINE_BREAK;
          } else {
            readUnquotedSlow(fieldValue);
          }
        }
      }
      fields[fieldCount++] = fieldValue;
    } while (fieldEnded === COMMA);

    if (fieldCount === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fieldCount;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fieldCount < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fieldCount });
      while (fieldCount < width) fields[fieldCount++] = '';
    } else if (fieldCount > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }

  return { columns: header ? (columns ?? []) : null, rows, errors };
}
