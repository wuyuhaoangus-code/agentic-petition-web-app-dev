# Petition Export Package — ZIP Naming Spec

When building the petition package ZIP, files are renamed for the user so the package is pre-organized. The user downloads one ZIP and gets clearly labeled files.

## Order and prefix (unchanged)

- `01 - Cover Letter.docx`
- `02 - Form G-1145.pdf` (or placeholder)
- `03 - Form G-28.pdf`
- `04 - Form I-140.pdf`
- `05 - Petition Letter.docx`
- Exhibit files (see below)

## Exhibit files: use actual file names

For each exhibit, include **all files** for that exhibit (from `user_exhibit_items` → `user_files` / `user_evidence_content`). Each file is renamed in the ZIP as:

```
{prefix} - Exhibit {N} - {Title} - {actual_file_name}.{ext}
```

- **prefix**: Zero-padded index in the package (e.g. `06`, `07`, …) so global order is clear.
- **N**: Exhibit number (`exhibit_number` from `user_exhibits`).
- **Title**: Exhibit title (sanitized for filenames: no path chars, reasonable length).
- **actual_file_name**: The real document name we show the user:
  - From `UserEvidenceContent.title` when the item has `content_id` and that content has a non-empty title, or
  - From `UserFile.file_name` when the item has `file_id` (same logic as `document_builder._get_item_name`).
  - Sanitize for filesystem (e.g. strip path chars, collapse spaces).
- **ext**: Original file extension (from `file_name` or content type).

We do the organization for the user; they can redownload the package and get these names.

## Multiple files under the same exhibit

- **Different names**: Use each file’s actual name.
  - `06 - Exhibit 1 - Awards and Recognition - Best Paper Award 2023.pdf`
  - `06 - Exhibit 1 - Awards and Recognition - IEEE Certificate.pdf`

- **Same name (collision)**: Append ` - 2`, ` - 3`, … before the extension only when needed.
  - `06 - Exhibit 1 - [Title] - Report.pdf`
  - `06 - Exhibit 1 - [Title] - Report - 2.pdf`
  - `06 - Exhibit 1 - [Title] - Report - 3.pdf`

So the ` - 2` / ` - 3` suffix is **only for disambiguation** when two or more files in the same exhibit would otherwise have the same ZIP entry name. If every file has a distinct name, no suffix is added.

## Items without a stored file

Exhibit items that are description-only (no `file_id`, only `content_id` with type `manual`) have no binary to put in the ZIP. Either omit them from the ZIP or add a placeholder (e.g. a short text file) with the same naming pattern; product decision.

## Sanitization

- Replace or remove characters that are invalid in filenames: `\ / : * ? " < > |`.
- Optionally truncate very long titles or file names to a max length (e.g. 100 chars) to avoid path length issues on Windows.
