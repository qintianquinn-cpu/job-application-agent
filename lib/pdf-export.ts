/**
 * Export CV or Cover Letter content to PDF.
 *
 * Opens a clean popup with only the CV content + its internal CSS.
 * Strips Tailwind utility classes and hides browser extension UI elements
 * so they don't appear in the printed PDF.
 */
export async function exportToPdf(
  elementId: string,
  filename: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element #${elementId} not found`);
  }

  // Deep clone the element
  const clone = element.cloneNode(true) as HTMLElement;

  // Strip border-related Tailwind classes from every element in the clone.
  // We only want the CV CSS to define borders, not the page's Tailwind.
  const borderClassRe = /\b(border|shadow|ring)(-[\w]+)*\b/g;

  const stripTailwindBorders = (el: HTMLElement) => {
    if (el.className && typeof el.className === "string") {
      el.className = el.className.replace(borderClassRe, "").replace(/\s+/g, " ").trim();
    }
    for (let i = 0; i < el.children.length; i++) {
      stripTailwindBorders(el.children[i] as HTMLElement);
    }
  };
  stripTailwindBorders(clone);

  // Collect only <style> tags from the CV preview itself (the CV_CSS), not the whole page.
  // The clone contains a <style> tag injected via dangerouslySetInnerHTML.
  const cloneStyles = clone.querySelector("style")?.textContent || "";

  const docContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${filename}</title>
<style>
  @page { size: A4; margin: 0; }

  /* Hide browser extension floating UI (translation bars, Grammarly, etc.) */
  [class*="docky"], [id*="docky"],
  [class*="grammarly"], [data-grammarly],
  [class*="extension"], [data-extension],
  grammarly-extension, grammarly-card,
  #_docky-extension-root, [_docky-extension] { display: none !important; }

  * { box-sizing: border-box; }

  html, body {
    margin: 0;
    padding: 0;
    background: white;
    width: 210mm;
    min-height: 297mm;
  }

  .cv-page {
    padding: 16mm 18mm;
  }

  ${cloneStyles}
</style>
</head>
<body>
  ${clone.outerHTML}
</body>
</html>`;

  // Open a popup window sized to A4
  const popup = window.open(
    "",
    "_blank",
    "width=900,height=1100,scrollbars=yes,resizable=yes"
  );

  if (!popup) {
    throw new Error(
      "Popup blocked. Please allow popups for this site, then try again."
    );
  }

  popup.document.open();
  popup.document.write(docContent);
  popup.document.close();

  // Wait for rendering, then trigger print
  popup.onload = () => {
    setTimeout(() => {
      popup.focus();
      popup.print();
    }, 800);
  };
}
