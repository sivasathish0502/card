# Wallace Cartwright & Co Ltd – website

- `wallace_vercel_deploy/`  → the website. Deploy THIS folder on Vercel or Netlify (no build step).
- `google-apps-script/Code.gs` → paste into Apps Script (steps are at the top of the file).

## Connect the form to Google Sheets
1. Open the target Google Sheet → Extensions → Apps Script → paste `Code.gs`.
2. Deploy → New deployment → Web app → Execute as: **Me**, Who has access: **Anyone**.
3. The deployed /exec URL is already set in `GOOGLE_SCRIPT_URL` near the bottom of `wallace_vercel_deploy/index.html`.
4. Open the /exec URL in a browser – it should show `{"result":"ok",...}`. Then submit the form once to test.
