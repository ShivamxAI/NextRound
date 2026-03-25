import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, FileText, X, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// --- FIREBASE IMPORT ---
import { auth } from "../lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";

export default function Profile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  // New States for Backend Integration
  const [skills, setSkills] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // --- 1. LOAD PROFILE DATA ON MOUNT ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch("/api/profile/", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setName(data.name || "");
            setEmail(data.email || "");
            setTargetRole(data.target_role || "");
            setSkills(data.skills || []);
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- 2. SAVE PROFILE CHANGES ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/profile/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name: name, target_role: targetRole })
      });

      if (!response.ok) throw new Error("Failed to update profile");
      toast({ title: "Profile updated successfully!" });
    } catch (error) {
      console.error(error);
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // --- 3. UPLOAD RESUME & EXTRACT SKILLS ---
  const uploadResume = async (selectedFile: File) => {
    setIsUploading(true);
    setFile(selectedFile);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // FormData is required for file uploads
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/profile/resume", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
          // Note: Do NOT set Content-Type for FormData. The browser handles the boundaries automatically.
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process resume");
      }

      const data = await response.json();
      setSkills(data.skills); // Update the UI with AI skills instantly!
      toast({ title: "Skills extracted successfully!" });

    } catch (error: any) {
      console.error(error);
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
      setFile(null); // Reset file if it failed
    } finally {
      setIsUploading(false);
    }
  };

  // File Handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") {
      uploadResume(f);
    } else {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      uploadResume(f);
    } else if (f) {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold font-display text-foreground">Profile</h1>

      {/* Profile form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} disabled className="bg-muted" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Target Role</Label>
            <Input id="role" placeholder="e.g. Frontend Engineer" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Resume</CardTitle>
          <CardDescription>Upload your PDF resume for AI-powered analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Drag & drop your resume here, or <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF Only — Max 10MB</p>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-primary shrink-0 animate-spin" />
              ) : (
                <FileText className="h-8 w-8 text-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isUploading ? "AI is analyzing your resume..." : `${(file.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
              {!isUploading && (
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setSkills([]); }}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-display">Extracted Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {skills.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Upload your resume to see AI-extracted skills
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}