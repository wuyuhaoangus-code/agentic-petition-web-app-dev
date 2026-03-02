Data load (same as MyPetition)

  const handleViewDocuments = async (version: PetitionVersion) => {
    setViewingDocumentsVersionId(version.id);
    setVersionDocsError(null);

    if (!applicationId || !version.runId || versionExhibits[version.id]) {
      return;
    }

    try {
      setIsLoadingVersionDocs(true);
      const exhibits = await fetchUserExhibits(applicationId, false, version.runId);
      setVersionExhibits((prev) => ({ ...prev, [version.id]: exhibits }));
    } catch (error: any) {
      console.error('Failed to load version documents:', error);
      setVersionDocsError(error?.message || 'Failed to load documents for this version.');
    } finally {
      setIsLoadingVersionDocs(false);
    }
  };

  ———

  Render logic (exact pattern)

  {exhibitsForVersion
    .slice()
    .sort((a, b) => a.exhibit_number - b.exhibit_number)
    .map((exhibit) => (
      <div key={exhibit.id} className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-purple-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            {`Exhibit ${exhibit.exhibit_number}: ${exhibit.title}`}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {getCriteriaLabel(exhibit.criteria_id)} • {exhibit.items.length} {exhibit.items.length === 1 ? 'file' : 'files'}
          </p>
        </div>
        <div className="bg-white divide-y divide-gray-100">
          {exhibit.items.map((item, index) => (
            <div
              key={`${exhibit.id}-${item.item_suffix}-${index}`}
              className="px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm text-gray-900">
                {item.file_name || item.content_title || `Supporting document ${item.item_suffix}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}

  ———

  Instruction summary

  - In Export Package, replace mock file list with fetchUserExhibits(applicationId, false, runId).
  - Render exhibits + items exactly like the “View Documents” modal above.
  - That guarantees the Export Package page matches Supabase data per run.