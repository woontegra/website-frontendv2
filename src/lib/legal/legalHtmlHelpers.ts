/** Yasal HTML yapı taşları — metin içeriğini değiştirmeden semantik sarmalayıcılar. */

export function legalMeta(updated: string): string {
  return `<p class="legal-meta"><span class="legal-meta__label">Son güncelleme tarihi:</span> ${updated}</p>`;
}

export function legalNote(innerHtml: string): string {
  return `<div class="legal-note" role="note">${innerHtml}</div>`;
}

export function legalSection(
  content: string,
  modifier?: 'public' | 'panel' | 'contact',
): string {
  const mod = modifier ? ` legal-section--${modifier}` : '';
  return `<section class="legal-section${mod}">${content}</section>`;
}

export function legalTableBox(
  title: string,
  tableHtml: string,
  modifier?: 'public' | 'panel' | 'signals',
): string {
  const mod = modifier ? ` legal-table-box--${modifier}` : '';
  const titleHtml = title.trim()
    ? `<h4 class="legal-table-box__title">${title}</h4>`
    : '';
  return `<div class="legal-table-box${mod}">${titleHtml}
<div class="legal-table-wrap">${tableHtml}</div>
</div>`;
}

export function legalTableRow(cells: string[]): string {
  return `<tr>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
}

export function legalTableHeadRow(cells: string[]): string {
  return `<tr>${cells.map((c) => `<th scope="col">${c}</th>`).join('')}</tr>`;
}

export function legalContactCard(innerHtml: string): string {
  return `<div class="legal-card legal-card--contact">${innerHtml}</div>`;
}
