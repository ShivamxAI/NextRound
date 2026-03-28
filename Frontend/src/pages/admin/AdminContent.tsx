import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Brain, BookOpen, MessageSquare, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminContent() {
  const [difficulty, setDifficulty] = useState("medium");
  const [categories, setCategories] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // 1. Fetch the settings when the page loads
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchWithAuth("/admin/settings");
        if (data.default_difficulty) setDifficulty(data.default_difficulty);
        if (data.categories) setCategories(data.categories);
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // 2. The function to save the new difficulty
  const handleSaveDifficulty = async () => {
    setSaving(true);
    try {
      await fetchWithAuth("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ default_difficulty: difficulty }),
      });
      
      // Show a success popup!
      toast({
        title: "Settings Saved",
        description: `Default interview difficulty set to ${difficulty}.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>Loading AI settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Content & AI Control</h1>
        <p className="text-muted-foreground mt-1">Configure interview settings, question categories, and AI behavior</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Difficulty */}
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
            {/* 3. Activated the Save Button */}
            <Button 
              className="w-full" 
              onClick={handleSaveDifficulty} 
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <p className="text-xs text-muted-foreground">This updates the global database settings.</p>
          </CardContent>
        </Card>

        {/* Question Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Question Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* 4. Now mapping over the live dynamic categories from Firestore */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.length > 0 ? categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="text-sm">
                  {cat}
                </Badge>
              )) : (
                <p className="text-sm text-muted-foreground">No categories found.</p>
              )}
            </div>
            <Button variant="outline" className="w-full">
              Manage Categories
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Add or edit question categories.</p>
          </CardContent>
        </Card>

        {/* ... Keep your existing Predefined Question Sets and AI Response Logs cards here exactly as they were ... */}
        
      </div>
    </div>
  );
}