import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// Convert to file:// URL for Windows compatibility
const workerPath = join(__dirname, "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).toString();

async function test() {
  const minimalPdf = Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>>>/Contents 5 0 R>>endobj 4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj 5 0 obj<</Length 44>>\nstream\nBT /F1 12 Tf 100 700 Td (Hello World PDF) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000274 00000 n \n0000000359 00000 n \ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n452\n%%EOF'
  );

  try {
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(minimalPdf) });
    const pdf = await loadingTask.promise;
    console.log(`✅ Pages: ${pdf.numPages}`);
    const page = await pdf.getPage(1);
    const content = await page.getTextContent();
    const text = content.items.map(i => (i).str).join(" ");
    console.log("✅ Extracted:", JSON.stringify(text));
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

test();
