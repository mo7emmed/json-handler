import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  FileJson, 
  ChevronRight, 
  ChevronDown,
  PlusCircle,
  Save,
  FilePlus,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  LogIn,
  LogOut,
  Cloud,
  CloudUpload,
  RefreshCw,
  Share2,
  LayoutDashboard,
  Lock,
  Unlock,
  ExternalLink,
  X,
  Search,
  Clock,
  Settings,
  Edit2,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';

type JSONValue = string | number | boolean | null | JSONObject | JSONArray;
interface JSONObject { [key: string]: JSONValue }
interface JSONArray extends Array<JSONValue> {}

interface CloudFile {
  id: string;
  name: string;
  updatedAt: any;
  isPublicEditable: boolean;
}

const JsonNode: React.FC<{
  name: string | number;
  value: JSONValue;
  onUpdate: (newValue: JSONValue) => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  isRoot?: boolean;
  depth: number;
  readOnly?: boolean;
}> = ({ name, value, onUpdate, onDelete, onRename, isRoot = false, depth, readOnly = false }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState(String(name));
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
  const isArray = Array.isArray(value);
  const isPrimitive = !isObject && !isArray;

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    const val = e.target.value;
    if (val === 'true') onUpdate(true);
    else if (val === 'false') onUpdate(false);
    else if (val === 'null') onUpdate(null);
    else if (!isNaN(Number(val)) && val.trim() !== '') onUpdate(Number(val));
    else onUpdate(val);
  };

  const handleKeySubmit = () => {
    if (readOnly) return;
    if (onRename && tempKey !== name && tempKey.trim() !== '') {
      onRename(tempKey);
    }
    setIsEditingKey(false);
  };

  const addItem = (type: 'value' | 'object' | 'array') => {
    if (readOnly) return;
    let newItem: JSONValue = "new item";
    if (type === 'object') newItem = {};
    if (type === 'array') newItem = [];

    if (isArray) {
      onUpdate([...value, newItem]);
    } else if (isObject) {
      const newKey = `key_${Object.keys(value).length}`;
      onUpdate({ ...value, [newKey]: newItem });
    }
    setIsExpanded(true);
    setIsAddMenuOpen(false);
  };

  const updateChild = (key: string | number, newValue: JSONValue) => {
    if (readOnly) return;
    if (isArray) {
      const newArr = [...value];
      newArr[key as number] = newValue;
      onUpdate(newArr);
    } else if (isObject) {
      onUpdate({ ...value, [key]: newValue });
    }
  };

  const deleteChild = (key: string | number) => {
    if (readOnly) return;
    if (isArray) {
      const newArr = (value as JSONArray).filter((_, i) => i !== key);
      onUpdate(newArr);
    } else if (isObject) {
      const newObj = { ...value };
      delete newObj[key];
      onUpdate(newObj);
    }
  };

  const renameChild = (oldKey: string, newKey: string) => {
    if (readOnly) return;
    if (isObject) {
      const newObj: JSONObject = {};
      Object.keys(value).forEach(k => {
        if (k === oldKey) newObj[newKey] = value[k];
        else newObj[k] = value[k];
      });
      onUpdate(newObj);
    }
  };

  const getBgColor = (d: number) => {
    if (isPrimitive) return 'bg-transparent';
    const colors = [
      'bg-white',
      'bg-zinc-50/50',
      'bg-blue-50/40',
      'bg-amber-50/40',
      'bg-emerald-50/40',
      'bg-rose-50/40',
      'bg-indigo-50/40',
      'bg-orange-50/40'
    ];
    return colors[d % colors.length];
  };

  return (
    <div className={`ml-${depth > 0 ? '4' : '0'} ${depth > 0 ? 'border-l border-zinc-200' : ''} pl-4 pr-2 py-1 my-1 rounded-lg transition-colors ${getBgColor(depth)}`}>
      <div className="flex items-center gap-2 group">
        {(isObject || isArray) && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-zinc-200 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}

        {!isRoot && (
          <div className="flex items-center gap-1">
            {isEditingKey && !readOnly ? (
              <input
                autoFocus
                className="text-xs font-mono bg-white border border-zinc-300 rounded px-1 outline-none focus:border-blue-500"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                onBlur={handleKeySubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleKeySubmit()}
              />
            ) : (
              <span 
                className={`text-xs font-mono font-medium text-zinc-600 ${onRename && !readOnly ? 'cursor-pointer hover:text-blue-600' : ''}`}
                onClick={() => onRename && !readOnly && setIsEditingKey(true)}
              >
                {name}:
              </span>
            )}
          </div>
        )}

        {isPrimitive ? (
          <input
            readOnly={readOnly}
            className={`text-xs font-mono bg-transparent border-b border-transparent outline-none px-1 py-0.5 min-w-[100px] ${
              readOnly ? 'cursor-default' : 'hover:border-zinc-300 focus:border-blue-500'
            }`}
            value={value === null ? 'null' : String(value)}
            onChange={handleValueChange}
          />
        ) : (
          <span className="text-xs text-zinc-400 italic">
            {isArray ? `Array [${(value as JSONArray).length}]` : `Object {${Object.keys(value as JSONObject).length}}`}
          </span>
        )}

        {!readOnly && (
          <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-0.5 transition-opacity relative">
            {(isObject || isArray) && (
              <div className="relative flex items-center">
                <AnimatePresence>
                  {isAddMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="absolute right-full mr-1 flex items-center gap-0.5 bg-white border border-zinc-200 rounded-md shadow-md p-0.5 z-10"
                    >
                      <button 
                        onClick={() => addItem('value')}
                        className="p-1 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 rounded"
                        title="Add Value"
                      >
                        <Plus size={12} />
                      </button>
                      <button 
                        onClick={() => addItem('object')}
                        className="p-1 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 rounded"
                        title="Add Object"
                      >
                        <FileJson size={12} />
                      </button>
                      <button 
                        onClick={() => addItem('array')}
                        className="p-1 text-zinc-500 hover:text-blue-600 hover:bg-zinc-50 rounded"
                        title="Add Array"
                      >
                        <List size={12} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button 
                  onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                  className={`p-1 rounded transition-colors ${isAddMenuOpen ? 'text-blue-600 bg-blue-50' : 'text-zinc-400 hover:text-blue-600 hover:bg-blue-50'}`}
                  title="Add options"
                >
                  <PlusCircle size={14} />
                </button>
              </div>
            )}
            {!isRoot && (
              <button 
                onClick={onDelete}
                className="p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (isObject || isArray) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {isArray ? (
              (value as JSONArray).map((item, index) => (
                <JsonNode
                  key={index}
                  name={index}
                  value={item}
                  depth={depth + 1}
                  onUpdate={(val) => updateChild(index, val)}
                  onDelete={() => deleteChild(index)}
                  readOnly={readOnly}
                />
              ))
            ) : (
              Object.entries(value as JSONObject).map(([key, val]) => (
                <JsonNode
                  key={key}
                  name={key}
                  value={val}
                  depth={depth + 1}
                  onUpdate={(v) => updateChild(key, v)}
                  onDelete={() => deleteChild(key)}
                  onRename={(newK) => renameChild(key, newK)}
                  readOnly={readOnly}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [jsonData, setJsonData] = useState<JSONObject>({
    project: "JSON Forge",
    version: 1.2,
    features: ["Cloud Dashboard", "Permissions", "Raw Link Import"],
    settings: {
      theme: "light",
      cloudSync: true
    }
  });
  const [fileName, setFileName] = useState("data.json");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [cloudId, setCloudId] = useState<string | null>(null);
  const [savedJsonData, setSavedJsonData] = useState<string>(JSON.stringify({
    project: "JSON Forge",
    version: 1.2,
    features: ["Cloud Dashboard", "Permissions", "Raw Link Import"],
    settings: {
      theme: "light",
      cloudSync: true
    }
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isPublicEditable, setIsPublicEditable] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  
  // History for Undo
  const [history, setHistory] = useState<JSONObject[]>([]);
  
  // Dashboard state
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [userFiles, setUserFiles] = useState<CloudFile[]>([]);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  
  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserFiles(currentUser.uid);
      } else {
        setUserFiles([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jsonUrl = params.get('url');
    const id = params.get('id');

    if (id) {
      loadFromCloud(id);
    } else if (jsonUrl) {
      loadFromUrl(jsonUrl);
    }
  }, []);

  const updateJsonData = (newData: JSONObject) => {
    setHistory(prev => [jsonData, ...prev].slice(0, 20)); // Keep last 20 states
    setJsonData(newData);
    
    // Check if it matches saved state
    if (JSON.stringify(newData) === savedJsonData) {
      setHasUnsavedChanges(false);
    } else {
      setHasUnsavedChanges(true);
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const [lastState, ...rest] = history;
    setJsonData(lastState);
    setHistory(rest);
    
    // Check if it matches saved state
    if (JSON.stringify(lastState) === savedJsonData) {
      setHasUnsavedChanges(false);
    } else {
      setHasUnsavedChanges(true);
    }
  };

  const renameFile = async (id: string | null, newName: string) => {
    if (!newName.trim()) return;
    if (id) {
      try {
        await setDoc(doc(db, 'jsonFiles', id), { name: newName }, { merge: true });
        if (user) fetchUserFiles(user.uid);
      } catch (err) {
        console.error("Error renaming file in cloud:", err);
      }
    }
    setFileName(newName);
  };

  const fetchUserFiles = async (uid: string) => {
    setIsFetchingFiles(true);
    try {
      const q = query(
        collection(db, 'jsonFiles'), 
        where('ownerId', '==', uid),
        orderBy('updatedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const files: CloudFile[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        files.push({
          id: doc.id,
          name: data.name,
          updatedAt: data.updatedAt,
          isPublicEditable: data.isPublicEditable || false
        });
      });
      setUserFiles(files);
    } catch (err) {
      console.error("Error fetching user files:", err);
    } finally {
      setIsFetchingFiles(false);
    }
  };

  const loadFromCloud = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'jsonFiles', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const content = JSON.parse(data.content);
        setJsonData(content);
        setSavedJsonData(data.content);
        setFileName(data.name);
        setCloudId(id);
        setIsPublicEditable(data.isPublicEditable || false);
        setHasUnsavedChanges(false);
        setHistory([]);
        
        // Check if read-only
        const isOwner = user && user.uid === data.ownerId;
        const canEdit = isOwner || data.isPublicEditable;
        setIsReadOnly(!canEdit);
      } else {
        throw new Error("Cloud file not found.");
      }
    } catch (err) {
      console.error("Error loading from cloud:", err);
      setError(err instanceof Error ? err.message : "Failed to load cloud file.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromUrl = async (url: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const urlObj = new URL(url);
      
      // Handle share links (e.g., ?id=... or ?url=...)
      const idParam = urlObj.searchParams.get('id');
      const urlParam = urlObj.searchParams.get('url');
      
      if (idParam) {
        loadFromCloud(idParam);
        return;
      }
      
      if (urlParam) {
        loadFromUrl(urlParam);
        return;
      }

      // Check if it's our own raw API link
      const rawMatch = url.match(/\/api\/raw\/([a-zA-Z0-9_-]+)/);
      if (rawMatch && rawMatch[1]) {
        loadFromCloud(rawMatch[1]);
        return;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const json = await response.json();
      setJsonData(json);
      setSavedJsonData(JSON.stringify(json));
      
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      setFileName(lastPart.endsWith('.json') ? lastPart : "remote-data.json");
      setCloudId(null);
      setIsReadOnly(false);
      setHistory([]);
    } catch (err) {
      console.error("Error loading JSON from URL:", err);
      setError("Failed to load remote JSON. Ensure the URL is correct and supports CORS.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setCloudId(null);
    setIsReadOnly(false);
    setHistory([]);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const contentStr = event.target?.result as string;
        const json = JSON.parse(contentStr);
        setJsonData(json);
        setSavedJsonData(contentStr);
        setHasUnsavedChanges(false);
      } catch (err) {
        setError("Invalid JSON file format.");
      }
    };
    reader.readAsText(file);
  };

  const saveToCloud = async () => {
    if (!user && !isPublicEditable) {
      handleLogin();
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const contentStr = JSON.stringify(jsonData);
      const payload = {
        name: fileName,
        content: contentStr,
        updatedAt: serverTimestamp(),
        ownerId: cloudId ? (await getDoc(doc(db, 'jsonFiles', cloudId))).data()?.ownerId : user?.uid,
        isPublicEditable: isPublicEditable
      };

      if (cloudId) {
        await setDoc(doc(db, 'jsonFiles', cloudId), payload, { merge: true });
      } else {
        const docRef = await addDoc(collection(db, 'jsonFiles'), payload);
        setCloudId(docRef.id);
        const newUrl = `${window.location.origin}${window.location.pathname}?id=${docRef.id}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
      }
      setSavedJsonData(contentStr);
      setHasUnsavedChanges(false);
      if (user) fetchUserFiles(user.uid);
      alert("Saved to cloud successfully!");
    } catch (err) {
      console.error("Error saving to cloud:", err);
      setError("Failed to save to cloud. Check permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteFile = async (id: string) => {
    console.log("Attempting to delete file:", id);
    try {
      await deleteDoc(doc(db, 'jsonFiles', id));
      console.log("File deleted successfully:", id);
      if (user) fetchUserFiles(user.uid);
      if (cloudId === id) {
        createNew();
      }
      setDeletingId(null);
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file. Check your permissions.");
      setDeletingId(null);
    }
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCloudId(null);
      setFileName("data.json");
      setIsDashboardOpen(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const createNew = () => {
    if (hasUnsavedChanges && !confirm("Discard unsaved changes?")) return;
    const emptyData = {};
    setJsonData(emptyData);
    setSavedJsonData(JSON.stringify(emptyData));
    setFileName("new-file.json");
    setCloudId(null);
    setError(null);
    setHasUnsavedChanges(false);
    setIsReadOnly(false);
    setIsPublicEditable(false);
    setHistory([]);
    window.history.pushState({}, '', window.location.pathname);
  };

  const openFromUrl = () => {
    const url = prompt("Enter a JSON URL or a JSON Forge raw link:");
    if (url) loadFromUrl(url);
  };

  const handleShare = () => {
    if (!cloudId) {
      alert("Please save your file to the cloud first to enable sharing.");
      return;
    }
    setIsShareModalOpen(true);
  };

  const copyLink = (type: 'editor' | 'raw') => {
    const link = type === 'editor' 
      ? `${window.location.origin}${window.location.pathname}?id=${cloudId}`
      : `${window.location.origin}/api/raw/${cloudId}`;
    
    navigator.clipboard.writeText(link);
    alert(`${type === 'editor' ? 'Editor' : 'Raw JSON'} link copied to clipboard!`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
          <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg text-white shrink-0">
            <FileJson size={19} className="sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0 hidden min-[450px]:block">
            <h1 className="font-semibold text-zinc-900 leading-tight text-xs sm:text-base truncate">JSON Forge</h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <p className="text-[8px] sm:text-[10px] text-zinc-400 font-mono truncate max-w-[60px] sm:max-w-[150px]">
                {cloudId ? `ID: ${cloudId.slice(0, 6)}` : 'Local'}
              </p>
              {cloudId && <Cloud size={10} className="text-blue-500 shrink-0" />}
              {hasUnsavedChanges && <div className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar py-1">
          {user && (
            <button 
              onClick={() => setIsDashboardOpen(!isDashboardOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-2 text-[10px] sm:text-sm font-medium rounded-md transition-colors shrink-0 ${
                isDashboardOpen ? 'bg-blue-50 text-blue-600' : 'text-zinc-600 hover:bg-zinc-100'
              }`}
              title="My Files"
            >
              <LayoutDashboard size={19} className="sm:w-5 sm:h-5" />
              <span className="hidden lg:inline">My Files</span>
            </button>
          )}

          <button 
            onClick={createNew}
            className="flex items-center gap-1.5 px-2.5 py-2 text-[10px] sm:text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors shrink-0"
            title="New File"
          >
            <FilePlus size={19} className="sm:w-5 sm:h-5" />
            <span className="hidden lg:inline">New</span>
          </button>
          
          <div className="relative group shrink-0">
            <button 
              className="flex items-center gap-1.5 px-2.5 py-2 text-[10px] sm:text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
              title="Open File"
            >
              <Upload size={19} className="sm:w-5 sm:h-5" />
              <span className="hidden lg:inline">Open</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 sm:w-48 bg-white border border-zinc-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40 p-1">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-2 py-1.5 text-[10px] sm:text-sm hover:bg-zinc-50 rounded-md flex items-center gap-2"
              >
                <FileJson size={14} /> Local File
              </button>
              <button 
                onClick={openFromUrl}
                className="w-full text-left px-2 py-1.5 text-[10px] sm:text-sm hover:bg-zinc-50 rounded-md flex items-center gap-2"
              >
                <ExternalLink size={14} /> From URL
              </button>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".json" 
            className="hidden" 
          />

          <button 
            onClick={saveToCloud}
            disabled={isSaving || isReadOnly}
            className={`flex items-center gap-1.5 px-2.5 py-2 text-[10px] sm:text-sm font-medium rounded-md transition-colors shrink-0 ${
              isReadOnly ? 'opacity-50 cursor-not-allowed' :
              hasUnsavedChanges 
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' 
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
            title="Save Online"
          >
            {isSaving ? <Loader2 size={19} className="animate-spin" /> : <CloudUpload size={19} className="sm:w-5 sm:h-5" />}
            <span className="hidden lg:inline">{cloudId ? 'Overwrite' : 'Save'}</span>
          </button>

          <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-2 text-[10px] sm:text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors shrink-0"
            title="Share"
          >
            <Share2 size={19} className="sm:w-5 sm:h-5" />
            <span className="hidden lg:inline">Share</span>
          </button>

          <div className="h-5 w-px bg-zinc-200 mx-0.5 shrink-0" />

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3 pl-1 shrink-0">
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-zinc-200 shrink-0" />
              <button onClick={handleLogout} className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-600 transition-colors" title="Logout">
                <LogOut size={19} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 text-[10px] sm:text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 rounded-md transition-colors shadow-sm shrink-0"
            >
              <LogIn size={19} className="sm:w-5 sm:h-5" />
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Dashboard Sidebar */}
        <AnimatePresence>
          {isDashboardOpen && (
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="w-80 bg-white border-r border-zinc-200 flex flex-col z-20 absolute inset-y-0 left-0 sm:relative"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                  <LayoutDashboard size={18} className="text-blue-600" />
                  My Cloud Files
                </h2>
                <button onClick={() => setIsDashboardOpen(false)} className="p-1 hover:bg-zinc-100 rounded">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isFetchingFiles ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                    <Loader2 size={24} className="animate-spin mb-2" />
                    <span className="text-xs">Fetching files...</span>
                  </div>
                ) : userFiles.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <FileJson size={32} className="mx-auto text-zinc-200 mb-2" />
                    <p className="text-sm text-zinc-500">No cloud files yet.</p>
                    <p className="text-xs text-zinc-400 mt-1">Save a file online to see it here.</p>
                  </div>
                ) : (
                  userFiles.map(file => (
                    <div 
                      key={file.id}
                      className={`group p-3 rounded-lg border transition-all cursor-pointer ${
                        cloudId === file.id 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-white border-transparent hover:border-zinc-200 hover:bg-zinc-50'
                      }`}
                      onClick={() => loadFromCloud(file.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm font-medium truncate ${cloudId === file.id ? 'text-blue-700' : 'text-zinc-900'}`}>
                            {file.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={10} className="text-zinc-400" />
                            <span className="text-[10px] text-zinc-400">
                              {file.updatedAt?.toDate().toLocaleDateString()}
                            </span>
                            {file.isPublicEditable ? (
                              <Unlock size={10} className="text-emerald-500" title="Publicly Editable" />
                            ) : (
                              <Lock size={10} className="text-zinc-300" title="Private" />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {deletingId === file.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded border border-red-100">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFile(file.id);
                                }}
                                className="text-[10px] font-bold text-red-600 hover:underline px-1"
                              >
                                Confirm
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(null);
                                }}
                                className="text-[10px] font-bold text-zinc-400 hover:underline px-1"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newName = prompt("Rename file:", file.name);
                                  if (newName) renameFile(file.id, newName);
                                }}
                                className="p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-600 transition-opacity"
                                title="Rename"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingId(file.id);
                                }}
                                className="p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 transition-opacity"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Editor Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto w-full">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <div className="text-sm">
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden relative min-h-[500px]">
              <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Editor</span>
                    {isReadOnly && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
                        <Lock size={10} /> View Only
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isEditingFileName ? (
                      <input
                        autoFocus
                        className="text-sm font-mono bg-white border border-zinc-300 rounded px-2 py-0.5 outline-none focus:border-blue-500"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        onBlur={() => {
                          setIsEditingFileName(false);
                          renameFile(cloudId, fileName);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setIsEditingFileName(false);
                            renameFile(cloudId, fileName);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2 group/name min-w-0">
                        <h2 
                          className={`text-xs sm:text-sm font-mono font-medium text-zinc-700 truncate ${!isReadOnly ? 'cursor-pointer hover:text-blue-600' : ''}`}
                          onClick={() => !isReadOnly && setIsEditingFileName(true)}
                        >
                          {fileName}
                        </h2>
                        {!isReadOnly && (
                          <button 
                            onClick={() => setIsEditingFileName(true)}
                            className="p-1 text-zinc-400 hover:text-blue-600 opacity-0 sm:group-hover/name:opacity-100 transition-opacity hidden sm:block"
                            title="Rename File"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 justify-end flex-1">
                  {hasUnsavedChanges && !isReadOnly && (
                    <button 
                      onClick={undo}
                      className="text-[9px] sm:text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 shrink-0"
                    >
                      <RefreshCw size={10} /> Undo
                    </button>
                  )}
                  {hasUnsavedChanges && (
                    <span className="text-[8px] sm:text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 sm:px-2 py-0.5 rounded-full uppercase whitespace-nowrap truncate">
                      Unsaved
                    </span>
                  )}
                  <div className="hidden sm:flex gap-1 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-red-400/20" />
                    <div className="w-2 h-2 rounded-full bg-amber-400/20" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400/20" />
                  </div>
                </div>
              </div>
              
              <div className={`p-6 overflow-x-auto transition-opacity duration-300 ${isLoading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <JsonNode
                  name="root"
                  value={jsonData}
                  onUpdate={(val) => {
                    updateJsonData(val as JSONObject);
                  }}
                  onDelete={() => {}}
                  isRoot={true}
                  depth={0}
                  readOnly={isReadOnly}
                />
              </div>

              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px]">
                  <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                  <p className="text-sm font-medium text-zinc-600">Loading data...</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <Share2 size={20} className="text-blue-600" />
                  Share JSON File
                </h2>
                <button onClick={() => setIsShareModalOpen(false)} className="p-1 hover:bg-zinc-100 rounded">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-700">Permissions</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setIsPublicEditable(false)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        !isPublicEditable 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <Lock size={20} />
                      <span className="text-xs font-semibold">View Only</span>
                    </button>
                    <button 
                      onClick={() => setIsPublicEditable(true)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        isPublicEditable 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                    >
                      <Unlock size={20} />
                      <span className="text-xs font-semibold">Publicly Editable</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">
                    {isPublicEditable 
                      ? "Anyone with the link can edit the values in this file." 
                      : "Anyone with the link can view but not modify the file."}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Editor Link</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        value={`${window.location.origin}${window.location.pathname}?id=${cloudId}`}
                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-600"
                      />
                      <button 
                        onClick={() => copyLink('editor')}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Raw JSON API</label>
                    <div className="flex gap-2">
                      <input 
                        readOnly 
                        value={`${window.location.origin}/api/raw/${cloudId}`}
                        className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-xs font-mono text-zinc-600"
                      />
                      <button 
                        onClick={() => copyLink('raw')}
                        className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-zinc-800 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end">
                <button 
                  onClick={async () => {
                    await saveToCloud();
                    setIsShareModalOpen(false);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-zinc-200 text-center flex items-center justify-between bg-white z-30">
        <p className="text-[10px] text-zinc-400">
          JSON Forge • Interactive Cloud Editor • v1.2
        </p>
        <button onClick={downloadJson} className="text-[10px] text-blue-600 hover:underline font-medium">
          Download Local Copy
        </button>
      </footer>
    </div>
  );
}
