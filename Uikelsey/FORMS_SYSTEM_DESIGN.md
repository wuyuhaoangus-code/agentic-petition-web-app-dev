# Forms Upload System - Technical Design

## Overview
The Forms upload system reuses the existing `user_files` table instead of creating a separate `user_forms` table, maintaining data consistency and simplifying the database structure.

## Data Model

### Storage Strategy
- **Table**: `user_files` (existing table)
- **Category**: `'Forms'` (distinguishes forms from other file types like evidence, degrees, etc.)
- **Criteria Field**: Stores the form type as an array, e.g., `['i140']`, `['g28']`, `['personal_statement']`

### Form Types
1. **i140** - I-140 Petition
2. **g28** - G-28 Notice of Appearance  
3. **g1145** - G-1145 E-Notification
4. **personal_statement** - Personal Statement
5. **documentation_index** - Supporting Documentation Index

## Database Schema

```sql
-- Using existing user_files table
-- No additional tables needed!

-- Sample query to get all forms for an application:
SELECT * FROM user_files 
WHERE application_id = '<application_id>' 
  AND category = 'Forms'
ORDER BY created_at ASC;

-- Sample query to get a specific form:
SELECT * FROM user_files 
WHERE application_id = '<application_id>' 
  AND category = 'Forms' 
  AND criteria @> ARRAY['i140']::text[];
```

## Storage Structure

Files are stored in the private `user-files` bucket:

```
user-files/
└── {userId}/
    └── {applicationId}/
        └── forms/
            ├── i140.pdf
            ├── g28.pdf
            ├── g1145.pdf
            ├── personal_statement.pdf
            └── documentation_index.pdf
```

## Service Layer

### formsService.ts

Key functions:
- `getForms(applicationId)` - Retrieves all forms for an application
- `uploadAndSaveForm(file, applicationId, userId, formType, formName)` - Uploads file and saves metadata
- `deleteForm(formId, applicationId, filePath)` - Deletes form and file
- `getSignedUrl(filePath)` - Gets temporary signed URL for viewing private files

### Data Mapping

The service maps `user_files` rows to a `UserForm` interface:

```typescript
UserForm {
  id: string              // from user_files.id
  form_type: string       // from criteria[0] (e.g., 'i140')
  form_name: string       // from file_name
  status: 'finished'      // Always 'finished' if file exists
  file_url: string        // from file_path
  file_size: number       // from file_size
  upload_date: string     // from created_at
  ...
}
```

## Frontend Integration

### Forms.tsx Component

Features:
- Lists 5 forms with upload buttons
- Shows upload status (Not Uploaded / Uploaded)
- "How to Fill" guides for USCIS forms (I-140, G-28, G-1145)
- Download blank forms
- Upload completed forms
- Preview uploaded forms (using signed URLs)
- Delete uploaded forms

### Layout
```
[Status Icon] [Form Content]                    [Upload Button]
              |
              ├─ Title + Description + Status Badge
              ├─ Uploaded File Info (if exists)
              └─ [How to Fill?] [Download] ← Reference buttons
```

## Security

### Row Level Security (RLS)
The existing RLS policies on `user_files` table apply:
- Users can only access their own files (`user_id = auth.uid()`)
- All CRUD operations are restricted to the file owner

### Private Storage
- Files stored in private `user-files` bucket
- Access via temporary signed URLs (expires in 1 hour)
- No public access to uploaded forms

## Benefits of This Design

✅ **Reuses Existing Infrastructure**
- No new tables to create or manage
- Uses existing `user_files` table and RLS policies
- Leverages existing `user-files` storage bucket

✅ **Consistent Data Model**
- Same structure as other file uploads (criteria, evidence, personal info)
- Category field enables flexible querying and filtering
- Easy to extend with new form types

✅ **Simplified Maintenance**
- Single source of truth for all user files
- Unified backup and migration strategy
- Consistent security model

✅ **Better Performance**
- Indexed by `application_id` and `category`
- Efficient queries with existing indexes
- No JOIN operations needed

## Usage Example

```typescript
// Upload a form
const formFile = new File([blob], 'I-140.pdf', { type: 'application/pdf' });
await formsService.uploadAndSaveForm(
  formFile,
  applicationId,
  userId,
  'i140',
  'I-140 Petition'
);

// Query all forms for an application
const forms = await formsService.getForms(applicationId);

// Get signed URL to view a form
const signedUrl = await formsService.getSignedUrl(form.file_url);

// Delete a form
await formsService.deleteForm(formId, applicationId, filePath);
```

## Migration Notes

Since we're using the existing `user_files` table:
- ✅ No SQL migrations required
- ✅ No new tables to create
- ✅ Works immediately with existing infrastructure

Just ensure the `category` column exists in `user_files` (it should already be there based on previous migrations).
