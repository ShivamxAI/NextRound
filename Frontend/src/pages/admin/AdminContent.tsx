import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Brain, BookOpen, MessageSquare, Loader2, X, Search, Eye, CheckCircle2, XCircle, FileText, BrainCircuit, AlertCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminContent() {
  // --- SETTINGS STATE ---
  const [difficulty, setDifficulty] = useState("medium");
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingDifficulty, setSavingDifficulty] = useState(false);
  const { toast } = useToast();

  // Category Management State
  const [isManaging, setIsManaging] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [savingCategories, setSavingCategories] = useState(false);

  // --- QUESTION SETS STATE ---
  const [questionSets, setQuestionSets] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [newRoleName, setNewRoleName] = useState<string>(""); // <-- ADDED MISSING STATE
  const [jsonInput, setJsonInput] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);
  const [isSavingSet, setIsSavingSet] = useState(false);

  // --- AI LOGS STATE ---
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedText, setSelectedText] = useState<{ title: string; content: string } | null>(null);

  // --- 1. LOAD DATA ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const settingsData = await fetchWithAuth("/admin/settings");
        if (settingsData.default_difficulty) setDifficulty(settingsData.default_difficulty);
        if (settingsData.categories) setCategories(settingsData.categories);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoadingSettings(false);
      }

      try {
        const logsData = await fetchWithAuth("/interview/admin/ai-logs");
        setAiLogs(logsData.logs || []);
      } catch (err) {
        console.error("Failed to load AI logs:", err);
      } finally {
        setLoadingLogs(false);
      }

      try {
        const setsData = await fetchWithAuth("/interview/admin/question-sets");
        setQuestionSets(setsData.question_sets || []);
      } catch (err) {
        console.error("Failed to load question sets:", err);
      }
    };
    loadData();
  }, []);

  // --- 2. SAVE DIFFICULTY ---
  const handleSaveDifficulty = async () => {
    setSavingDifficulty(true);
    try {
      await fetchWithAuth("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ default_difficulty: difficulty }),
      });
      toast({ title: "Settings Saved", description: `Difficulty set to ${difficulty}.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSavingDifficulty(false);
    }
  };

  // --- 3. CATEGORY FUNCTIONS ---
  const addCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
    }
  };

  const removeCategory = (catToRemove: string) => {
    setCategories(categories.filter((c) => c !== catToRemove));
  };

  const handleSaveCategories = async () => {
    setSavingCategories(true);
    try {
      await fetchWithAuth("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ categories: categories }),
      });
      toast({ title: "Categories Saved", description: "Question categories updated successfully." });
      setIsManaging(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to save categories.", variant: "destructive" });
    } finally {
      setSavingCategories(false);
    }
  };

  // --- 4. QUESTION SETS FUNCTIONS ---
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setJsonError(null);
    setJsonSuccess(null);
    setNewRoleName(""); // Clear the input when switching
    
    if (roleId === "new") {
      setJsonInput('[\n  "Type your first question here",\n  "Type your second question here"\n]');
      return;
    }
    
    const selected = questionSets.find(s => s.id === roleId);
    if (selected) {
      setJsonInput(JSON.stringify(selected.questions, null, 2));
    }
  };

  const handleVerifyAndSave = async () => {
    setJsonError(null);
    setJsonSuccess(null);
    
    let parsedData;
    
    // Validate JSON
    try {
      parsedData = JSON.parse(jsonInput);
    } catch (e: any) {
      setJsonError(`Invalid JSON syntax: ${e.message}`);
      return;
    }
    
    // Validate it's an Array of Strings
    if (!Array.isArray(parsedData) || !parsedData.every(item => typeof item === 'string')) {
      setJsonError("Data must be a valid JSON Array containing only strings.");
      return;
    }

    // Determine the Role Name from the new input field!
    let roleName = selectedRole;
    if (selectedRole === "new") {
      if (!newRoleName.trim()) {
        setJsonError("Please type a title for the new role.");
        return;
      }
      roleName = newRoleName.trim();
    } else {
      const existing = questionSets.find(s => s.id === selectedRole);
      if (existing) roleName = existing.role;
    }

    setJsonSuccess("Valid JSON Array. Saving to database...");
    setIsSavingSet(true);

    // Save to Backend
    try {
      await fetchWithAuth("/interview/admin/question-sets", {
        method: "POST",
        body: JSON.stringify({ role: roleName, questions: parsedData }),
      });
      
      toast({ title: "Success", description: `${roleName} questions saved!` });
      
      // Refresh the question sets list
      const setsData = await fetchWithAuth("/interview/admin/question-sets");
      setQuestionSets(setsData.question_sets || []);
      
      // Select the newly saved one
      const newId = roleName.toLowerCase().replace(/ /g, "_");
      setSelectedRole(newId);
      
    } catch (err) {
      setJsonError("Failed to save to database. Check network logs.");
    } finally {
      setIsSavingSet(false);
      setTimeout(() => setJsonSuccess(null), 3000);
    }
  };

  // --- 5. LOGS FILTERING ---
  const filteredLogs = aiLogs.filter(log => 
    log.action.toLowerCase().includes(search.toLowerCase()) || 
    log.status.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>Loading AI settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Content & AI Control</h1>
        <p className="text-muted-foreground mt-1">Configure interview settings, question categories, and AI behavior</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Difficulty Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Interview Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSaveDifficulty} disabled={savingDifficulty}>
              {savingDifficulty ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {savingDifficulty ? "Saving..." : "Save Changes"}
            </Button>
            <p className="text-xs text-muted-foreground">This updates the global database settings.</p>
          </CardContent>
        </Card>

        {/* Question Categories Card */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Question Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Display Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-sm flex items-center gap-1">
                    {cat}
                    {isManaging && (
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive transition-colors ml-1" 
                        onClick={() => removeCategory(cat)} 
                      />
                    )}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No categories found.</p>
              )}
            </div>

            {/* Inline Editor Toggle */}
            {isManaging ? (
              <div className="space-y-3 mt-4 border-t pt-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. React, Python, System Design..." 
                    value={newCategory} 
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <Button onClick={addCategory} variant="secondary">Add</Button>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSaveCategories} disabled={savingCategories}>
                    {savingCategories ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Categories
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setIsManaging(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => setIsManaging(true)}>
                Manage Categories
              </Button>
            )}
            <p className="text-xs text-muted-foreground mt-2">Add or edit question categories.</p>
          </CardContent>
        </Card>

        {/* --- PREDEFINED QUESTION SETS (JSON EDITOR) --- */}
        <Card className="lg:col-span-2 border-indigo-100 shadow-sm">
          <CardHeader className="bg-indigo-50/50 pb-4 border-b border-indigo-50">
            <CardTitle className="font-display text-lg flex items-center gap-2 text-indigo-900">
              <MessageSquare className="h-5 w-5 text-indigo-500" />
              Predefined Question Sets (JSON Editor)
            </CardTitle>
            <CardDescription className="text-indigo-700/70">
              Select a role and edit the raw JSON array of questions to bypass AI generation for standard roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            
            <div className="space-y-2">
              <Label>Target Job Role</Label>
              <Select value={selectedRole} onValueChange={handleRoleSelect}>
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue placeholder="Select a role to edit..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new" className="text-primary font-medium">+ Create New Role</SelectItem>
                  {questionSets.map(set => (
                    <SelectItem key={set.id} value={set.id}>{set.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* --- THE MISSING INPUT BOX IS HERE --- */}
            {selectedRole === "new" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 w-full md:w-[300px]">
                <Label>New Role Title</Label>
                <Input 
                  placeholder="e.g. Senior React Developer" 
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
              </div>
            )}
            {/* ----------------------------------- */}

            {selectedRole && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <Label>Questions Array (JSON)</Label>
                <Textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="font-mono text-sm bg-zinc-950 text-emerald-400 min-h-[200px]"
                  placeholder='[\n  "Question 1",\n  "Question 2"\n]'
                />
                
                {jsonError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{jsonError}</p>
                  </div>
                )}
                
                {jsonSuccess && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-md border border-emerald-200">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <p>{jsonSuccess}</p>
                  </div>
                )}

                <Button 
                  onClick={handleVerifyAndSave} 
                  disabled={isSavingSet}
                  className="w-full md:w-auto"
                >
                  {isSavingSet ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Verify Format & Save Set
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- AI RESPONSE LOGS TABLE --- */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><BrainCircuit className="h-5 w-5 text-primary" /> AI Response Logs</CardTitle>
            <CardDescription>Monitor AI generation quality, latency, and prompts.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="px-6">Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead className="text-right px-6">Data Payload</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLogs ? (
                 <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground font-medium">No AI logs found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/10">
                    <TableCell className="px-6">
                      {log.status === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(log.timestamp)}</TableCell>
                    <TableCell><Badge className="uppercase text-[10px] bg-primary/10 text-primary" variant="outline">{log.action.replace("_", " ")}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.latency_ms ? `${(log.latency_ms / 1000).toFixed(2)}s` : "N/A"}</TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedText({title: `Prompt: ${log.action}`, content: log.prompt})}><Search className="h-3.5 w-3.5 mr-1.5" /> Prompt</Button>
                        <Button variant="secondary" size="sm" onClick={() => setSelectedText({title: `Response: ${log.action}`, content: log.response})}><Eye className="h-3.5 w-3.5 mr-1.5" /> Output</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- AI LOG MODAL --- */}
      {selectedText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <CardHeader className="border-b flex flex-row items-center justify-between py-4 bg-muted/30">
              <CardTitle className="text-lg font-display capitalize">{selectedText.title.replace("_", " ")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedText(null)}><X className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto p-6 bg-zinc-950 text-emerald-400 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                {selectedText.content || "No content recorded."}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}