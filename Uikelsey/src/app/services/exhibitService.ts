import { supabase } from '../../lib/supabase';

export interface ExhibitItem {
  file_id: string | null;
  content_id: string | null;
  item_suffix: string;
  // Additional FE-only fields
  file_name?: string;
  content_title?: string;
}

export interface UserExhibit {
  id: string;
  run_id?: string;
  criteria_id: string;
  title: string;
  exhibit_number: number;
  summary: string | null;
  created_at: string;
  items: ExhibitItem[];
}

/**
 * Fetch user exhibits from Supabase
 * @param applicationId - The application ID to filter exhibits
 * @param latestOnly - If true, only fetch exhibits from the most recent run_id
 */
export async function fetchUserExhibits(
  applicationId: string,
  latestOnly: boolean = true,
  runId?: string
): Promise<UserExhibit[]> {
  console.log('📥 Loading exhibits from Supabase for application:', applicationId);

  try {
    // Step 1: Query user_exhibits table
    let exhibitsQuery = supabase
      .from('user_exhibits')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (runId) {
      exhibitsQuery = exhibitsQuery.eq('run_id', runId);
    } else if (latestOnly) {
      // If latestOnly, we need to get the most recent run_id first
      const { data: latestExhibit, error: latestError } = await supabase
        .from('user_exhibits')
        .select('run_id, created_at')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestError) {
        console.error('❌ Failed to get latest run_id:', latestError);
        throw new Error(`Failed to get latest run_id: ${latestError.message}`);
      }

      if (!latestExhibit) {
        console.log('ℹ️ No exhibits found for application');
        return [];
      }

      console.log(`🔍 Filtering by latest run_id: ${latestExhibit.run_id}`);
      
      // Filter by the latest run_id
      exhibitsQuery = exhibitsQuery.eq('run_id', latestExhibit.run_id);
    }

    const { data: exhibits, error: exhibitsError } = await exhibitsQuery;

    if (exhibitsError) {
      console.error('❌ Failed to fetch exhibits:', exhibitsError);
      throw new Error(`Failed to fetch exhibits: ${exhibitsError.message}`);
    }

    if (!exhibits || exhibits.length === 0) {
      console.log('ℹ️ No exhibits found');
      return [];
    }

    console.log(`✅ Found ${exhibits.length} exhibits`);
    console.log('📋 Raw exhibits from Supabase:', JSON.stringify(exhibits, null, 2));

    // Step 2: For each exhibit, fetch its items
    const exhibitsWithItems = await Promise.all(
      exhibits.map(async (exhibit) => {
        const { data: items, error: itemsError } = await supabase
          .from('user_exhibit_items')
          .select('*')
          .eq('exhibit_id', exhibit.id);

        if (itemsError) {
          console.error(`❌ Failed to fetch items for exhibit ${exhibit.id}:`, itemsError);
          return {
            ...exhibit,
            items: []
          };
        }

        console.log(`📦 Raw items for exhibit "${exhibit.title}" (${exhibit.id}):`, JSON.stringify(items, null, 2));
        
        // Step 3: For each item, fetch file/content names
        const itemsWithNames = await Promise.all(
          (items || []).map(async (item) => {
            let file_name: string | undefined;
            let content_title: string | undefined;

            // Fetch file name if file_id exists
            if (item.file_id) {
              const { data: fileData, error: fileError } = await supabase
                .from('user_files')  // ✅ Fixed: was user_documents
                .select('file_name')
                .eq('id', item.file_id)
                .single();

              if (!fileError && fileData) {
                file_name = fileData.file_name;
              } else {
                console.warn(`⚠️ Could not fetch file name for file_id ${item.file_id}:`, fileError);
              }
            }

            // Fetch content title if content_id exists
            if (item.content_id) {
              const { data: contentData, error: contentError } = await supabase
                .from('user_evidence_content')
                .select('title')
                .eq('id', item.content_id)
                .single();

              if (!contentError && contentData) {
                content_title = contentData.title;
              }
            }

            return {
              file_id: item.file_id,
              content_id: item.content_id,
              item_suffix: item.item_suffix,
              file_name,
              content_title
            };
          })
        );

        console.log(`✅ Loaded ${itemsWithNames.length} items for exhibit \"${exhibit.title}\"`);
        console.log(`📄 Items with names for exhibit \"${exhibit.title}\":`, JSON.stringify(itemsWithNames, null, 2));
        
        return {
          id: exhibit.id,
          run_id: exhibit.run_id,
          criteria_id: exhibit.criteria_id,
          title: exhibit.title,
          exhibit_number: exhibit.exhibit_number,
          summary: exhibit.summary,
          created_at: exhibit.created_at,
          items: itemsWithNames
        };
      })
    );

    console.log(`✅ Successfully loaded ${exhibitsWithItems.length} exhibits with items`);
    console.log('🎯 Final exhibits with items:', JSON.stringify(exhibitsWithItems, null, 2));
    return exhibitsWithItems;
  } catch (error: any) {
    console.error('❌ Error in fetchUserExhibits:', error);
    throw error;
  }
}

/**
 * Confirm exhibits and trigger petition generation
 * This calls the backend to finalize the mapping and generate the petition
 */
export async function confirmExhibits(
  applicationId: string,
  exhibitsByCriteria: Record<string, UserExhibit[]>,
  runId: string
): Promise<void> {
  console.log('💾 Confirming exhibits and triggering petition generation...');

  try {
    const confirmPromises = Object.entries(exhibitsByCriteria).map(async ([criteriaId, criteriaExhibits]) => {
      const payload = {
        criteria_id: criteriaId,
        run_id: runId,
        application_id: applicationId,
        exhibits: criteriaExhibits.map(ex => ({
          title: ex.title,
          summary: ex.summary || '',
          doc_ids: ex.items.map(item => item.file_id || item.content_id).filter(Boolean) as string[]
        }))
      };

      console.log(`📤 Confirming exhibits for criterion: ${criteriaId}`, payload);

      const response = await fetch('/api/v1/petitions/confirm-exhibits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to confirm exhibits for ${criteriaId}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Confirmed exhibits for criterion ${criteriaId}:`, result);
      
      return result;
    });

    await Promise.all(confirmPromises);
    
    console.log('✅ All exhibits confirmed successfully');
  } catch (error: any) {
    console.error('❌ Failed to confirm exhibits:', error);
    throw error;
  }
}