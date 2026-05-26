# Connect questionnaire pages 7–11 to Google Forms

Submissions from **Submit** on page 11 are sent to a Google Form. Responses appear in the linked **Google Sheet** (Responses tab).

## 1. Create the Google Form

1. Open [Google Forms](https://forms.google.com) and create a blank form.
2. Add these questions **in this order** (short answer for each):

   | Question label | Maps to |
   |----------------|---------|
   | How far will you go? | `embarkDistance` |
   | Will you need a guide? | `needGuide` |
   | Will you stay the night? | `stayNight` |
   | Will you be conjoined? | `conjoined` |
   | When will you embark? | `embarkWhen` (comma-separated dates) |

3. Open the form’s **Responses** tab → link to Google Sheets (creates “Form Responses 1”).

## 2. Get the form action URL

1. In the form editor, click **Send** → link icon → shorten URL if you like.
2. Open the form in the browser (`.../viewform`).
3. **View page source** (Ctrl+U) and search for `form action`.
4. Copy the URL that looks like:

   `https://docs.google.com/forms/d/e/XXXXXXXXXXXXXXXX/formResponse`

   Use the **`formResponse`** URL, not `viewform`.

## 3. Get entry IDs for each question

**Option A — Prefill link (easiest)**

1. Click **⋮** → **Get pre-filled link**.
2. Type `test` in each answer → **Get link**.
3. The URL contains `entry.1234567890=test` for each field. Copy each `entry.XXXXXXXX` value.

**Option B — Page source**

1. On the live form page, view source and search for `entry.`.
2. Match order of inputs to your five questions.

## 4. Configure this project

1. Copy `google-form.config.example.js` to `google-form.config.js` (if you don’t already have it).
2. Paste your `actionUrl` and five `entry.*` IDs:

```javascript
window.GOOGLE_FORM_CONFIG = {
  actionUrl: "https://docs.google.com/forms/d/e/YOUR_ID/formResponse",
  entries: {
    embarkDistance: "entry.111111111",
    needGuide: "entry.222222222",
    stayNight: "entry.333333333",
    conjoined: "entry.444444444",
    embarkWhen: "entry.555555555",
  },
};
```

3. Commit `google-form.config.js` if you deploy via GitHub Pages (the URL and entry IDs are visible in the browser anyway).

## 5. Test

1. Open the site locally or on Pages.
2. Complete the flow through page 11, pick dates, click **Submit**.
3. Check the form’s **Responses** sheet for a new row.

If nothing appears, confirm `actionUrl` ends with `/formResponse` and every `entries` value starts with `entry.`.

## Notes

- Submit uses `no-cors`, so the browser cannot read Google’s response; a failed config fails silently. Use the test above.
- Values sent: `bike` / `train-bike`, `no` / `yes`, and embark dates as `YYYY-MM-DD` joined with commas.
- Until `actionUrl` is set, Submit still goes to page 12 but skips the form POST.
