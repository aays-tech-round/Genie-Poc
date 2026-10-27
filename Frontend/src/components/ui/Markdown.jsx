// Small Markdown renderer for Genie's text answers. Builds React elements
// directly (no innerHTML), covering what Genie actually returns: headings,
// paragraphs, lists, tables, code, quotes, rules and inline emphasis/links.

const SAFE_URL = /^(https?:|mailto:)/i;

const HEADING_SIZES = { h3: 'text-[1.125rem]', h4: 'text-[1.025rem]' };
const LIST = 'space-y-[0.3rem] pl-[1.4rem] marker:text-secondary';
const CELL = 'border-b border-line px-[0.9rem] py-[0.55rem] text-left';

// Inline: `code`, **bold**, __bold__, *italic*, _italic_, [text](url).
// Underscore emphasis must sit on word boundaries so column names like
// total_sales_amount stay intact.
const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*|(?<!\w)__[^_]+__(?!\w))|(\*[^*\s][^*]*\*|(?<!\w)_[^_\s][^_]*_(?!\w))|(\[[^\]]+\]\([^)\s]+\))/;

function renderInline(text, keyPrefix = 'i') {
  const out = [];
  let rest = text;
  let n = 0;
  while (rest) {
    const m = rest.match(INLINE);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const token = m[0];
    const key = `${keyPrefix}-${n++}`;
    if (m[1]) {
      out.push(<code key={key} className="rounded-md border border-line bg-accent-soft px-[0.4em] py-[0.12em] font-mono text-[0.85em]">{token.slice(1, -1)}</code>);
    } else if (m[2]) {
      out.push(<strong key={key} className="font-semibold">{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (m[3]) {
      out.push(<em key={key}>{renderInline(token.slice(1, -1), key)}</em>);
    } else if (m[4]) {
      const [, label, href] = token.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      out.push(
        SAFE_URL.test(href)
          ? (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline decoration-accent-soft underline-offset-2 transition-[text-decoration-color] hover:decoration-current"
            >
              {renderInline(label, key)}
            </a>
          )
          : label
      );
    }
    rest = rest.slice(m.index + token.length);
  }
  return out;
}

const splitRow = (line) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

const isTableDivider = (line) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s+(.*)$/;

function parseBlocks(src) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    // Fenced code
    if (/^\s*```/.test(line)) {
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push({ type: 'code', text: body.join('\n') });
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].replace(/\s*#+\s*$/, '') });
      i++;
      continue;
    }

    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Table: header row followed by a |---| divider
    if (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const header = splitRow(line);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]));
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    if (/^\s*>/.test(line)) {
      const body = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ''));
      blocks.push({ type: 'quote', text: body.join('\n') });
      continue;
    }

    const item = line.match(LIST_ITEM);
    if (item) {
      const ordered = /\d/.test(item[1]);
      const start = ordered ? parseInt(item[1], 10) : undefined;
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(LIST_ITEM);
        if (m && /\d/.test(m[1]) === ordered) {
          items.push(m[2]);
          i++;
        } else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) {
          // Indented continuation line belongs to the previous item
          items[items.length - 1] += `\n${lines[i++].trim()}`;
        } else {
          break;
        }
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items, start });
      continue;
    }

    // Paragraph: runs until a blank line or the start of another block
    const body = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^\s*(#{1,6}\s|```|>)/.test(lines[i]) &&
      !LIST_ITEM.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1]))
    ) {
      body.push(lines[i++]);
    }
    blocks.push({ type: 'p', text: body.join('\n') });
  }
  return blocks;
}

// Keeps single line breaks inside a paragraph or list item
const withBreaks = (text, key) =>
  text.split('\n').flatMap((part, idx) =>
    idx === 0 ? renderInline(part, `${key}-${idx}`) : [<br key={`${key}-br${idx}`} />, ...renderInline(part, `${key}-${idx}`)]
  );

export default function Markdown({ text }) {
  if (!text) return null;
  const blocks = parseBlocks(String(text));

  return (
    <div className="space-y-3 leading-[1.7] text-primary">
      {blocks.map((b, idx) => {
        const key = `b${idx}`;
        switch (b.type) {
          case 'heading': {
            const Tag = `h${Math.min(b.level + 2, 6)}`;
            return (
              <Tag
                key={key}
                className={`mt-5 leading-[1.35] font-semibold tracking-[-0.01em] text-primary first:mt-0 ${HEADING_SIZES[Tag] || 'text-[0.95rem]'}`}
              >
                {renderInline(b.text, key)}
              </Tag>
            );
          }
          case 'code':
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-xl border border-line bg-soft px-4 py-[0.85rem] font-mono text-[0.85rem] leading-[1.6] whitespace-pre"
              >
                <code>{b.text}</code>
              </pre>
            );
          case 'hr':
            return <hr key={key} className="my-5 h-px border-none bg-line" />;
          case 'quote':
            return (
              <blockquote key={key} className="border-l-[3px] border-accent py-[0.15rem] pl-[0.9rem] text-secondary">
                {withBreaks(b.text, key)}
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={key} className={`${LIST} list-disc`}>
                {b.items.map((it, j) => <li key={j}>{withBreaks(it, `${key}-${j}`)}</li>)}
              </ul>
            );
          case 'ol':
            return (
              <ol key={key} className={`${LIST} list-decimal`} start={b.start}>
                {b.items.map((it, j) => <li key={j}>{withBreaks(it, `${key}-${j}`)}</li>)}
              </ol>
            );
          case 'table':
            return (
              <div key={key} className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full border-collapse text-sm tabular-nums">
                  <thead>
                    <tr>
                      {b.header.map((h, j) => (
                        <th key={j} className={`${CELL} bg-soft text-[0.8rem] font-semibold text-secondary`}>
                          {renderInline(h, `${key}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="[&:last-child>td]:border-b-0">
                        {b.header.map((_, k) => (
                          <td key={k} className={CELL}>{renderInline(r[k] || '', `${key}-${j}-${k}`)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return <p key={key}>{withBreaks(b.text, key)}</p>;
        }
      })}
    </div>
  );
}
