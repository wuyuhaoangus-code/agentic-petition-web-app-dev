import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkNode } from '@lexical/link';
import { CodeNode } from '@lexical/code';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  COMMAND_PRIORITY_LOW,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { 
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from '@lexical/list';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Save,
  Download,
  ArrowLeft,
  FileText,
  X,
  Edit3
} from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import '@/styles/lexical.css';

interface PetitionEditorProps {
  version: {
    id: string;
    version: number;
    type: 'ai_generated' | 'edited' | 'user_uploaded';
    generatedAt: Date;
    title: string;
    status: 'generating' | 'ready' | 'error';
    usedDocuments?: string[];
    sectionDocuments?: { [section: string]: string[] };
    content?: string; // JSON serialized editor state
  };
  onSave?: (version: PetitionEditorProps['version']) => void;
  onCancel?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  previewMode?: boolean;
}

// Toolbar Plugin
function ToolbarPlugin({ previewMode }: { previewMode: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = React.useState(false);
  const [isItalic, setIsItalic] = React.useState(false);
  const [isUnderline, setIsUnderline] = React.useState(false);

  const updateToolbar = React.useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  React.useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  if (previewMode) return null;

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(headingSize));
      }
    });
  };

  const formatAlignment = (alignment: 'left' | 'center' | 'right') => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const insertList = (type: 'bullet' | 'number') => {
    if (type === 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center gap-1 flex-wrap z-10">
      {/* Text formatting */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => formatText('bold')}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${isBold ? 'bg-gray-300' : ''}`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${isItalic ? 'bg-gray-300' : ''}`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${isUnderline ? 'bg-gray-300' : ''}`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => formatHeading('h1')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatHeading('h2')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatHeading('h3')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => formatAlignment('left')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatAlignment('center')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          onClick={() => formatAlignment('right')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </button>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => insertList('bullet')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertList('number')}
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Initial content plugin
function InitialContentPlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      if (root.getFirstChild() === null) {
        const heading = $createHeadingNode('h1');
        heading.append($createTextNode('Petition Letter for EB-1A Extraordinary Ability'));
        root.append(heading);

        const intro = $createHeadingNode('h2');
        intro.append($createTextNode('I. Introduction'));
        root.append(intro);

        const introPara = $createParagraphNode();
        introPara.append($createTextNode('This petition is submitted on behalf of [Your Name], who seeks classification as an alien of extraordinary ability in the field of [Your Field] under section 203(b)(1)(A) of the Immigration and Nationality Act.'));
        root.append(introPara);

        const background = $createHeadingNode('h2');
        background.append($createTextNode('II. Background and Qualifications'));
        root.append(background);

        const backgroundPara = $createParagraphNode();
        backgroundPara.append($createTextNode('[Your background and qualifications content here...]'));
        root.append(backgroundPara);

        const evidence = $createHeadingNode('h2');
        evidence.append($createTextNode('III. Evidence of Extraordinary Ability'));
        root.append(evidence);

        const criterion1 = $createHeadingNode('h3');
        criterion1.append($createTextNode('Criterion 1: Awards for Excellence'));
        root.append(criterion1);

        const criterion1Para = $createParagraphNode();
        criterion1Para.append($createTextNode('[Your evidence for this criterion...]'));
        root.append(criterion1Para);

        const conclusion = $createHeadingNode('h2');
        conclusion.append($createTextNode('V. Conclusion'));
        root.append(conclusion);

        const conclusionPara = $createParagraphNode();
        conclusionPara.append($createTextNode('[Your conclusion...]'));
        root.append(conclusionPara);
      }
    });
  }, [editor]);

  return null;
}

// OnChange Plugin to track changes
function OnChangePlugin({ onChange }: { onChange: () => void }) {
  const [editor] = useLexicalComposerContext();
  
  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
        onChange();
      }
    });
  }, [editor, onChange]);
  
  return null;
}

// Save Content Plugin - provides access to editor for saving
function SaveContentPlugin({ onGetContent }: { onGetContent: (getContent: () => string) => void }) {
  const [editor] = useLexicalComposerContext();
  
  React.useEffect(() => {
    const getContent = () => {
      let content = '';
      editor.getEditorState().read(() => {
        content = JSON.stringify(editor.getEditorState().toJSON());
      });
      return content;
    };
    
    onGetContent(getContent);
  }, [editor, onGetContent]);
  
  return null;
}

// Load Content Plugin - loads saved content
function LoadContentPlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext();
  const [isLoaded, setIsLoaded] = React.useState(false);
  
  React.useEffect(() => {
    if (content && !isLoaded) {
      try {
        const editorState = editor.parseEditorState(content);
        editor.setEditorState(editorState);
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load editor content:', error);
      }
    }
  }, [editor, content, isLoaded]);
  
  return null;
}

export function PetitionEditor({ 
  version,
  onSave, 
  onCancel,
  onDownload,
  onEdit,
  previewMode = false
}: PetitionEditorProps) {
  const [hasChanges, setHasChanges] = React.useState(false);
  const [showDocumentsPopup, setShowDocumentsPopup] = React.useState(false);
  const getContentRef = React.useRef<(() => string) | null>(null);

  const initialConfig = {
    namespace: 'PetitionEditor',
    theme: {
      heading: {
        h1: 'text-3xl font-bold mb-4 mt-6',
        h2: 'text-2xl font-bold mb-3 mt-5',
        h3: 'text-xl font-semibold mb-2 mt-4',
      },
      paragraph: 'mb-3 leading-relaxed',
      list: {
        nested: {
          listitem: 'list-none',
        },
        ol: 'list-decimal ml-6 mb-3',
        ul: 'list-disc ml-6 mb-3',
      },
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
      },
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      CodeNode,
    ],
    editable: !previewMode,
    onError: (error: Error) => {
      console.error('Lexical Error:', error);
    },
  };

  const handleSave = () => {
    if (onSave && getContentRef.current) {
      const content = getContentRef.current();
      const updatedVersion = {
        ...version,
        content,
        type: 'edited' as const,
      };
      onSave(updatedVersion);
      setHasChanges(false);
    }
  };

  const totalDocuments = version.sectionDocuments 
    ? Object.values(version.sectionDocuments).flat().length 
    : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="gap-2 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          {/* Title and Status */}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{version.title}</h2>
            <p className="text-sm text-gray-500">
              {previewMode ? (
                <span>Preview Mode - Read Only</span>
              ) : hasChanges ? (
                <span className="text-amber-600 font-medium">Unsaved changes</span>
              ) : (
                <span>All changes saved</span>
              )}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Documents Used Button */}
            {version.sectionDocuments && totalDocuments > 0 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocumentsPopup(!showDocumentsPopup)}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Documents</span>
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {totalDocuments}
                  </span>
                </Button>

                {/* Documents Popup */}
                <AnimatePresence>
                  {showDocumentsPopup && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowDocumentsPopup(false)}
                      />
                      
                      {/* Popup */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-xl z-50"
                      >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">Documents Used</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {totalDocuments} {totalDocuments === 1 ? 'document' : 'documents'} across {Object.keys(version.sectionDocuments!).length} {Object.keys(version.sectionDocuments!).length === 1 ? 'section' : 'sections'}
                            </p>
                          </div>
                          <button
                            onClick={() => setShowDocumentsPopup(false)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-[400px] overflow-y-auto p-4">
                          <div className="space-y-3">
                            {(() => {
                              // Mock document data - in real app this would come from backend
                              const mockDocuments: { [key: string]: { name: string; category: string }[] } = {
                                'Introduction & Background': [
                                  { name: 'Resume_2024.pdf', category: 'Personal Documents' },
                                  { name: 'CV_Detailed.pdf', category: 'Professional Background' }
                                ],
                                'Awards for Excellence': [
                                  { name: 'Best_Paper_Award_2023.pdf', category: 'Awards' },
                                  { name: 'Excellence_Certificate.pdf', category: 'Recognition' },
                                  { name: 'Innovation_Award_Letter.pdf', category: 'Awards' }
                                ],
                                'Published Material': [
                                  { name: 'Nature_Article_2023.pdf', category: 'Publications' },
                                  { name: 'IEEE_Paper_Acceptance.pdf', category: 'Publications' },
                                  { name: 'Research_Feature_TechCrunch.pdf', category: 'Media Coverage' },
                                  { name: 'Interview_Forbes.pdf', category: 'Media Coverage' }
                                ],
                                'Judging the Work of Others': [
                                  { name: 'PC_Member_Certificate_ICML.pdf', category: 'Conference Service' },
                                  { name: 'Reviewer_Letter_Nature.pdf', category: 'Peer Review' }
                                ],
                                'Original Contributions': [
                                  { name: 'Patent_US12345678.pdf', category: 'Intellectual Property' },
                                  { name: 'Algorithm_Implementation_GitHub.pdf', category: 'Technical Contributions' },
                                  { name: 'Research_Impact_Report.pdf', category: 'Impact Evidence' }
                                ],
                                'Conclusion': [
                                  { name: 'Recommendation_Letter_Prof_Smith.pdf', category: 'Letters of Support' }
                                ]
                              };

                              // Group documents by category
                              const documentsByCategory: { [category: string]: string[] } = {};
                              Object.entries(version.sectionDocuments!).forEach(([section, docIds]) => {
                                const docsForSection = mockDocuments[section] || [];
                                docsForSection.forEach((doc) => {
                                  if (!documentsByCategory[doc.category]) {
                                    documentsByCategory[doc.category] = [];
                                  }
                                  documentsByCategory[doc.category].push(doc.name);
                                });
                              });

                              return Object.entries(documentsByCategory).map(([category, docs]) => (
                                <div key={category}>
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    <div className="text-xs font-semibold text-gray-700 break-words">
                                      {category}
                                    </div>
                                    <span className="text-xs text-gray-500 ml-auto">
                                      {docs.length}
                                    </span>
                                  </div>
                                  <div className="space-y-1 pl-3">
                                    {docs.map((docName, idx) => (
                                      <div 
                                        key={idx} 
                                        className="text-xs text-gray-600 border-l-2 border-primary/30 pl-2 py-0.5 hover:border-primary hover:text-gray-900 transition-colors break-words"
                                      >
                                        {docName}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="gap-2 hidden sm:flex"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
            {previewMode ? (
              onEdit && (
                <Button
                  onClick={onEdit}
                  className="bg-primary hover:bg-primary/90 gap-2"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )
            ) : (
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="bg-primary hover:bg-primary/90 gap-2"
                size="sm"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Editor */}
      <LexicalComposer initialConfig={initialConfig}>
        <div className="flex-1 overflow-auto relative bg-white">
          <ToolbarPlugin previewMode={previewMode} />
          
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-6 pb-16">
                  <ContentEditable 
                    className="min-h-[600px] outline-none focus:outline-none"
                    style={{
                      caretColor: '#434E87',
                    }}
                  />
                </div>
              }
              placeholder={
                !previewMode ? (
                  <div className="absolute top-0 left-0 right-0 max-w-4xl mx-auto px-6 sm:px-8 pt-6 text-gray-400 pointer-events-none">
                    Start editing your petition letter...
                  </div>
                ) : null
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
          
          <HistoryPlugin />
          <ListPlugin />
          <InitialContentPlugin />
          <OnChangePlugin onChange={() => setHasChanges(true)} />
          <SaveContentPlugin onGetContent={(getContent) => {
            getContentRef.current = getContent;
          }} />
          <LoadContentPlugin content={version.content} />
        </div>
      </LexicalComposer>
    </div>
  );
}