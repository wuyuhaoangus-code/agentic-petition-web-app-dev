import { supabase } from "../../lib/supabase";
import { projectId } from "@/lib/supabase-info";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api/v1"
).replace(/\/$/, "");

export interface CriteriaFile {
  id: string;
  application_id: string;
  name: string;
  size: number;
  upload_date: string;
  file_type?: string;
  criteria: string[];
  file_path?: string;
  url?: string;
  is_sensitive?: boolean;
  category?: string; // No restrictions - can be any string value
  content_hash?: string; // Added for duplicate detection
}

export interface SensitiveDescription {
  id: string;
  application_id: string;
  title: string;
  description: string;
  criteria: string[];
  created_date: string;
}

// Helper function to generate file hash
async function generateFileHash(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      arrayBuffer,
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  } catch (error) {
    console.error("Error generating file hash:", error);
    // Fallback: use file name + size + lastModified as pseudo-hash
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
}

// Initialize storage bucket
let bucketInitialized = false;
async function ensureBucketExists() {
  if (bucketInitialized) return;

  try {
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      // Silently skip - bucket likely exists
      bucketInitialized = true;
      return;
    }

    const bucketExists = buckets?.some(
      (bucket) => bucket.name === "user-files",
    );

    if (bucketExists) {
      console.log("✅ user-files bucket already exists");
    } else {
      // Try to create bucket, but don't fail if RLS prevents it
      await supabase.storage.createBucket("user-files", {
        public: false,
        fileSizeLimit: 20971520, // 20MB
        allowedMimeTypes: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "image/png",
          "image/jpeg",
          "image/jpg",
        ],
      });
      // Silently succeed or fail - bucket may already exist
    }

    bucketInitialized = true;
  } catch (error) {
    // Silently skip all errors - bucket likely exists
    bucketInitialized = true;
  }
}

// localStorage helper for sensitive descriptions (temporary data)
const LOCAL_STORAGE_PREFIX = "dreamcard_";

const storage = {
  getAll(prefix: string): any[] {
    const items: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith(LOCAL_STORAGE_PREFIX + prefix)
      ) {
        try {
          const value = localStorage.getItem(key);
          if (value) items.push(JSON.parse(value));
        } catch (e) {
          console.error(
            "Error parsing localStorage item:",
            key,
            e,
          );
        }
      }
    }
    return items;
  },

  get(key: string): any | null {
    try {
      const value = localStorage.getItem(
        LOCAL_STORAGE_PREFIX + key,
      );
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error("Error getting from localStorage:", key, e);
      return null;
    }
  },

  set(key: string, value: any): void {
    try {
      localStorage.setItem(
        LOCAL_STORAGE_PREFIX + key,
        JSON.stringify(value),
      );
    } catch (e) {
      console.error("Error setting localStorage:", key, e);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + key);
  },
};

async function triggerBackendOcr(
  documentId: string,
  applicationId: string,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    console.warn("⚠️ Skipping OCR trigger: missing auth token");
    return;
  }

  const formData = new FormData();
  formData.append("application_id", applicationId);

  try {
    const response = await fetch(
      `${API_BASE_URL}/documents/ocr-from-storage/${documentId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      // Check if response is HTML (common in dev environment when API doesn't exist)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn('OCR API endpoint returned HTML instead of JSON - likely API not available in this environment');
        return; // Silently skip OCR in preview environment
      }
      
      const errorText = await response.text();
      throw new Error(
        `OCR trigger failed (${response.status}): ${errorText}`,
      );
    }
  } catch (error: any) {
    // Handle network errors or JSON parsing errors gracefully
    console.error('Error triggering OCR:', error);
    
    // If it's a parsing error (HTML instead of JSON), skip silently
    if (error.message && (error.message.includes('JSON') || error.message.includes('HTML'))) {
      console.warn('Received non-JSON response from OCR endpoint, skipping OCR');
      return;
    }
    
    // Re-throw other errors
    throw error;
  }
}

export const criteriaService = {
  // --- Files ---

  async getFiles(
    applicationId: string,
    categoryFilter?: // Personal Information Categories
    | "resumeCV"
      | "graduation_certificates"
      | "employment_verification"
      | "future_plan"
      | "other_personalinfo"
      // Evidence Category
      | "evidence"
      // Form Categories (细分)
      | "personal_statement"
      | "supporting_document"
      | "I140"
      | "G28"
      | "G1145"
      // Legacy categories (for backward compatibility)
      | "graduationcertificates"
      | "employmentverification"
      | "futureplan"
      | "personalstatement"
      | "supportingdocument",
  ): Promise<CriteriaFile[]> {
    try {
      console.log(
        "🔍 Fetching files for application:",
        applicationId,
      );

      // Get user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.warn("⚠️ User not authenticated");
        return [];
      }

      // Fetch from database table with optional category filter
      let query = supabase
        .from("user_files")
        .select("*")
        .eq("application_id", applicationId)
        .eq("user_id", user.id);

      // Add category filter if provided
      if (categoryFilter) {
        query = query.eq("category", categoryFilter);
      }

      const { data: files, error } = await query.order(
        "created_at",
        { ascending: false },
      );

      if (error) {
        console.error(
          "❌ Error fetching files from database:",
          error,
        );
        return [];
      }

      console.log(
        `✅ Found ${files?.length || 0} files in database`,
      );

      // Generate signed URLs for files with file_url
      const filesWithUrls = await Promise.all(
        (files || []).map(async (file: any) => {
          // ✅ Handle criteria as comma-separated string or array
          let criteriaArray: string[] = [];

          if (
            typeof file.criteria === "string" &&
            file.criteria.trim()
          ) {
            // String format - could be JSON array string or comma-separated
            const trimmed = file.criteria.trim();

            if (trimmed.startsWith("[")) {
              // JSON array string: '["awards","judging"]' or "[\"awards\",\"judging\"]"
              try {
                criteriaArray = JSON.parse(trimmed);
              } catch (e) {
                console.error(
                  "Failed to parse criteria JSON:",
                  trimmed,
                  e,
                );
                criteriaArray = [];
              }
            } else {
              // Comma-separated string: "awards,judging"
              criteriaArray = trimmed
                .split(",")
                .map((c: string) => c.trim())
                .filter((c: string) => c !== "");
            }
          } else if (Array.isArray(file.criteria)) {
            // Array format - but items might be JSON strings
            criteriaArray = file.criteria
              .map((item: any) => {
                if (typeof item === "string") {
                  const trimmed = item.trim();
                  // Check if it's a JSON array string like '["published_material"]'
                  if (trimmed.startsWith("[")) {
                    try {
                      const parsed = JSON.parse(trimmed);
                      return Array.isArray(parsed)
                        ? parsed
                        : [trimmed];
                    } catch (e) {
                      return [trimmed];
                    }
                  }
                  return trimmed;
                }
                return item;
              })
              .flat() // Flatten in case we got nested arrays
              .filter((c: string) => c && c.trim() !== "");
          }

          // ✅ Clean up criteria: remove quotes and empty strings
          criteriaArray = criteriaArray
            .map((c: string) => {
              if (typeof c === "string") {
                // Remove leading/trailing quotes
                return c.replace(/^["']|["']$/g, "").trim();
              }
              return c;
            })
            .filter((c: string) => c && c !== "");

          // ✅ Migrate legacy criteria names for backward compatibility
          criteriaArray = criteriaArray.map((c: string) => {
            if (c === "press") return "published_material";
            if (c === "publishedmaterial")
              return "published_material";
            return c;
          });

          console.log(
            `✅ Processed criteria for ${file.file_name}:`,
            criteriaArray,
          );

          if (file.file_url) {
            const { data: signedData } = await supabase.storage
              .from("user-files")
              .createSignedUrl(file.file_url, 3600); // 1 hour expiry
            return {
              id: file.id,
              application_id: file.application_id,
              name: file.file_name,
              size: file.file_size,
              upload_date: file.created_at,
              criteria: criteriaArray,
              file_path: file.file_url,
              url: signedData?.signedUrl,
              is_sensitive: file.is_sensitive || false,
              category: file.category || "evidence",
              content_hash: file.content_hash || "",
            };
          }
          return {
            id: file.id,
            application_id: file.application_id,
            name: file.file_name,
            size: file.file_size,
            upload_date: file.created_at,
            criteria: criteriaArray,
            file_path: file.file_url,
            is_sensitive: file.is_sensitive || false,
            category: file.category || "evidence",
            content_hash: file.content_hash || "",
          };
        }),
      );

      return filesWithUrls;
    } catch (error) {
      console.error("❌ Error fetching files:", error);
      return [];
    }
  },

  // Check for duplicate files in the same category
  async checkDuplicateFile(
    contentHash: string,
    applicationId: string,
    category: string, // Accept any string
  ): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: existingFiles, error } = await supabase
        .from("user_files")
        .select("id")
        .eq("user_id", user.id)
        .eq("application_id", applicationId)
        .eq("category", category)
        .eq("content_hash", contentHash)
        .limit(1);

      if (error) {
        console.error("❌ Error checking duplicate:", error);
        return false;
      }

      return (existingFiles?.length || 0) > 0;
    } catch (error) {
      console.error("❌ Error in duplicate check:", error);
      return false;
    }
  },

  // Find existing file with same content in this application (any personal_info category).
  // Used to avoid re-storing the same file when user assigns it to another category.
  async findExistingPersonalFileByHash(
    contentHash: string,
    applicationId: string,
  ): Promise<{
    id: string;
    file_url: string;
    file_name: string;
    file_size: number;
    file_type: string;
  } | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const personalCategories = [
        "resumeCV",
        "graduation_certificates",
        "employment_verification",
        "other_personalinfo",
      ];
      const { data: existing, error } = await supabase
        .from("user_files")
        .select("id, file_url, file_name, file_size, file_type")
        .eq("user_id", user.id)
        .eq("application_id", applicationId)
        .eq("content_hash", contentHash)
        .in("category", personalCategories)
        .limit(1)
        .maybeSingle();

      if (error || !existing) return null;
      return existing;
    } catch (error) {
      console.error(
        "❌ Error finding existing personal file by hash:",
        error,
      );
      return null;
    }
  },

  async uploadAndSaveFile(
    file: File,
    applicationId: string,
    criteria: string[] | null = null, // ✅ Allow null, default to null
    isSensitive: boolean = false,
    category: string = "evidence", // Accept any string, default to 'evidence'
  ): Promise<CriteriaFile> {
    // 0. Ensure bucket exists (skip the creation error)
    try {
      await ensureBucketExists();
    } catch (e) {
      console.warn(
        "⚠️ Bucket creation skipped (may already exist)",
      );
    }

    // 1. Validation
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only PDF, DOCX, PNG, and JPG are allowed.",
      );
    }
    const maxSize = 50 * 1024 * 1024; // 50MB (increased from 20MB)
    if (file.size > maxSize) {
      throw new Error("File size exceeds 50MB limit.");
    }

    // 2. Generate hash and check for duplicates
    console.log("🔐 Generating file hash...");
    const contentHash = await generateFileHash(file);

    // 3. Get User ID for path construction
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const hasExplicitCriteria =
      Array.isArray(criteria) && criteria.length > 0;
    const criteriaToDB = hasExplicitCriteria
      ? criteria
      : category === "evidence"
        ? criteria || []
        : null;
    const personalCategories = [
      "resumeCV",
      "graduation_certificates",
      "employment_verification",
      "other_personalinfo",
    ];
    const isPersonalInfoUpload =
      personalCategories.includes(category) &&
      (criteriaToDB === null ||
        (Array.isArray(criteriaToDB) &&
          criteriaToDB.includes("personal_info")));

    // 4. If same file already stored for this application (personal_info), reuse it: add new row with same file_url, new category only (no re-upload, no OCR).
    if (isPersonalInfoUpload) {
      const existing =
        await this.findExistingPersonalFileByHash(
          contentHash,
          applicationId,
        );
      if (existing) {
        console.log(
          "✅ Same file already stored; mapping to additional category without re-uploading",
        );
        const { data: insertedFile, error: dbError } =
          await supabase
            .from("user_files")
            .insert({
              user_id: user.id,
              application_id: applicationId,
              file_name: existing.file_name,
              file_size: existing.file_size,
              file_url: existing.file_url,
              file_type: existing.file_type,
              criteria: criteriaToDB,
              is_sensitive: isSensitive,
              category: category,
              content_hash: contentHash,
            })
            .select()
            .single();

        if (dbError) {
          console.error(
            "❌ Error mapping file to category:",
            dbError,
          );
          throw new Error(
            `Failed to map file to category: ${dbError.message}`,
          );
        }
        console.log(
          `✅ Mapped existing file to category: ${category}`,
        );
        const { data: signedData } = await supabase.storage
          .from("user-files")
          .createSignedUrl(existing.file_url, 3600);
        return {
          id: insertedFile.id,
          application_id: applicationId,
          name: insertedFile.file_name,
          size: insertedFile.file_size,
          file_path: insertedFile.file_url,
          criteria: criteriaToDB || [],
          upload_date: insertedFile.created_at,
          url: signedData?.signedUrl ?? undefined,
          category: insertedFile.category,
        };
      }
    }

    // Same-category duplicate check (optional, can re-enable)
    // const isDuplicate = await this.checkDuplicateFile(contentHash, applicationId, category);
    // if (isDuplicate) { ... }

    // 5. Prepare upload path and upload to Storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_",
    );
    const filePath = `${user.id}/${applicationId}/${timestamp}_${sanitizedName}`;

    console.log("📤 Uploading file to storage:", filePath);
    const { error: uploadError } = await supabase.storage
      .from("user-files")
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("❌ Upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log("✅ File uploaded successfully to Storage");

    // 6. Save metadata to database table
    const { data: insertedFile, error: dbError } =
      await supabase
        .from("user_files")
        .insert({
          user_id: user.id,
          application_id: applicationId,
          file_name: file.name,
          file_size: file.size,
          file_url: filePath,
          file_type: file.type,
          criteria: criteriaToDB,
          is_sensitive: isSensitive,
          category: category,
          content_hash: contentHash,
        })
        .select()
        .single();

    if (dbError) {
      console.error("❌ Database insert error:", dbError);
      await supabase.storage
        .from("user-files")
        .remove([filePath]);
      throw new Error(
        `Failed to save file metadata: ${dbError.message}`,
      );
    }

    console.log(
      `✅ Metadata saved to database table (category: ${category}, criteria: ${criteriaToDB ? "array" : "null"})`,
    );

    // 7. Trigger backend OCR so extracted text lands in user_evidence_content
    try {
      await triggerBackendOcr(insertedFile.id, applicationId);
      console.log(
        `✅ OCR triggered for document ${insertedFile.id}`,
      );
    } catch (ocrError) {
      console.warn(
        "⚠️ File uploaded but OCR trigger failed:",
        ocrError,
      );
    }

    // 9. Return with signed URL for immediate UI use
    const { data: signedData } = await supabase.storage
      .from("user-files")
      .createSignedUrl(filePath, 3600);

    return {
      id: insertedFile.id,
      application_id: applicationId,
      name: file.name,
      size: file.size,
      file_path: filePath,
      criteria: criteriaToDB || [], // Return empty array for UI compatibility
      upload_date: insertedFile.created_at,
      is_sensitive: isSensitive,
      url: signedData?.signedUrl,
      category: category,
      content_hash: contentHash,
    };
  },

  async addFile(
    file: Omit<CriteriaFile, "id" | "upload_date" | "url">,
  ): Promise<CriteriaFile> {
    // Get User ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: insertedFile, error } = await supabase
      .from("user_files")
      .insert({
        user_id: user.id,
        application_id: file.application_id,
        file_name: file.name,
        file_size: file.size,
        file_url: file.file_path || "",
        criteria: file.criteria,
        is_sensitive: file.is_sensitive || false,
        category: file.category || "evidence",
        content_hash: file.content_hash || "",
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error adding file:", error);
      throw new Error(`Failed to add file: ${error.message}`);
    }

    return {
      id: insertedFile.id,
      application_id: file.application_id,
      name: file.name,
      size: file.size,
      upload_date: insertedFile.created_at,
      criteria: file.criteria,
      file_path: file.file_path,
      is_sensitive: file.is_sensitive,
      category: file.category,
      content_hash: file.content_hash,
    };
  },

  async updateFileCriteria(
    fileId: string,
    criteria: string[],
    applicationId: string,
  ): Promise<void> {
    // ✅ Filter out empty strings from criteria array
    const cleanedCriteria = criteria.filter(
      (c) => c && c.trim() !== "",
    );

    // ✅ Get user ID for RLS
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("❌ User not authenticated");
      throw new Error("User not authenticated");
    }

    console.log(
      `🔄 Updating file criteria for file ${fileId}:`,
      cleanedCriteria,
    );

    const { error } = await supabase
      .from("user_files")
      .update({ criteria: cleanedCriteria }) // ✅ Removed updated_at
      .eq("id", fileId)
      .eq("user_id", user.id) // ✅ Add user_id check for RLS
      .eq("application_id", applicationId); // ✅ Add application_id check

    if (error) {
      console.error("❌ Error updating file criteria:", error);
      throw new Error(
        `Failed to update criteria: ${error.message}`,
      );
    }

    console.log(
      "✅ Updated file criteria in database:",
      cleanedCriteria,
    );
  },

  // Update file category (for changing file classification)
  async updateFileCategory(
    fileId: string,
    category: string,
    applicationId: string,
  ): Promise<void> {
    // ✅ Get user ID for RLS
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("❌ User not authenticated");
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("user_files")
      .update({ category: category }) // ✅ Removed updated_at
      .eq("id", fileId)
      .eq("user_id", user.id) // ✅ Add user_id check for RLS
      .eq("application_id", applicationId); // ✅ Add application_id check

    if (error) {
      console.error("❌ Error updating file category:", error);
      throw new Error(
        `Failed to update category: ${error.message}`,
      );
    }

    console.log(
      `✅ Updated file category to '${category}' in database`,
    );
  },

  // Update both criteria and category at once
  async updateFileMetadata(
    fileId: string,
    updates: { criteria?: string[]; category?: string },
    applicationId: string,
  ): Promise<void> {
    // ✅ Get user ID for RLS
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.error("❌ User not authenticated");
      throw new Error("User not authenticated");
    }

    const updateData: any = {}; // ✅ Removed updated_at default

    if (updates.criteria !== undefined) {
      updateData.criteria = updates.criteria;
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }

    const { error } = await supabase
      .from("user_files")
      .update(updateData)
      .eq("id", fileId)
      .eq("user_id", user.id) // ✅ Add user_id check for RLS
      .eq("application_id", applicationId); // ✅ Add application_id check

    if (error) {
      console.error("❌ Error updating file metadata:", error);
      throw new Error(
        `Failed to update metadata: ${error.message}`,
      );
    }

    console.log("✅ Updated file metadata in database");
  },

  async deleteFile(
    fileId: string,
    applicationId: string,
  ): Promise<void> {
    // Get file info first to delete from storage
    const { data: file, error: fetchError } = await supabase
      .from("user_files")
      .select("file_url") // Changed from file_path to file_url
      .eq("id", fileId)
      .single();

    if (fetchError) {
      console.error(
        "❌ Error fetching file for deletion:",
        fetchError,
      );
      throw new Error(
        `Failed to fetch file: ${fetchError.message}`,
      );
    }

    // Delete from storage
    if (file?.file_url) {
      try {
        await supabase.storage
          .from("user-files")
          .remove([file.file_url]);
        console.log("✅ Deleted file from storage");
      } catch (e) {
        console.warn("⚠️ Could not delete physical file:", e);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("user_files")
      .delete()
      .eq("id", fileId);

    if (deleteError) {
      console.error(
        "❌ Error deleting file from database:",
        deleteError,
      );
      throw new Error(
        `Failed to delete file: ${deleteError.message}`,
      );
    }

    console.log("✅ Deleted file metadata from database");
  },

  // --- Sensitive Descriptions ---

  async getSensitiveDescriptions(
    applicationId: string,
  ): Promise<SensitiveDescription[]> {
    try {
      // ✅ Get user ID for scoped localStorage key
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("⚠️ User not authenticated");
        return [];
      }

      console.log(
        "🔍 Fetching descriptions for application:",
        applicationId,
      );
      const descriptions = storage.getAll(
        `desc_${user.id}_${applicationId}_`,
      );
      console.log(
        `✅ Found ${descriptions.length} descriptions in localStorage`,
      );
      return descriptions;
    } catch (error) {
      console.error("❌ Error fetching descriptions:", error);
      return [];
    }
  },

  async addSensitiveDescription(
    desc: Omit<SensitiveDescription, "id" | "created_date">,
  ): Promise<SensitiveDescription> {
    // ✅ Get user ID for scoped localStorage key
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const descId = crypto.randomUUID();
    const newDesc: SensitiveDescription = {
      ...desc,
      id: descId,
      created_date: new Date().toISOString(),
    };

    storage.set(
      `desc_${user.id}_${desc.application_id}_${descId}`,
      newDesc,
    );
    console.log("✅ Saved description to localStorage");
    return newDesc;
  },

  async updateSensitiveDescriptionCriteria(
    descId: string,
    criteria: string[],
    applicationId: string,
  ): Promise<void> {
    // ✅ Get user ID for scoped localStorage key
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const desc = storage.get(`desc_${user.id}_${applicationId}_${descId}`);
    if (desc) {
      desc.criteria = criteria;
      storage.set(`desc_${user.id}_${applicationId}_${descId}`, desc);
      console.log(
        "✅ Updated description criteria in localStorage",
      );
    }
  },

  async deleteSensitiveDescription(
    descId: string,
    applicationId: string,
  ): Promise<void> {
    // ✅ Get user ID for scoped localStorage key
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    storage.remove(`desc_${user.id}_${applicationId}_${descId}`);
    console.log("✅ Deleted description from localStorage");
  },
};