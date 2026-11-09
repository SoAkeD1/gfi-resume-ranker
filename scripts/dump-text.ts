// Dev helper: dumps raw text of every resume to data/text/<file>.txt for inspection.
import fs from "node:fs";
import path from "node:path";
import mammoth from "mammoth";

const dir = path.join(process.cwd(), "public", "resumes");
const out = path.join(process.cwd(), "data", "text");
fs.mkdirSync(out, { recursive: true });

(async () => {
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".docx"))) {
    try {
      const { value } = await mammoth.extractRawText({ path: path.join(dir, f) });
      fs.writeFileSync(path.join(out, f.replace(/\.docx$/, ".txt")), value);
      console.log(f, value.length);
    } catch (e) {
      console.log(f, "ERROR", (e as Error).message);
    }
  }
})();
