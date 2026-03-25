import { useState } from "react";
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
import { Settings, Brain, BookOpen, MessageSquare } from "lucide-react";

export default function AdminContent() {
  const [difficulty, setDifficulty] = useState("medium");

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
            <Button className="w-full" disabled>
              Save Changes
            </Button>
            <p className="text-xs text-muted-foreground">Backend integration required to persist settings.</p>
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
            <div className="flex flex-wrap gap-2 mb-4">
              {["Data Structures", "Algorithms", "System Design", "Behavioral", "OOP", "Databases", "Web Dev", "DevOps"].map(
                (cat) => (
                  <Badge key={cat} variant="secondary" className="text-sm">
                    {cat}
                  </Badge>
                )
              )}
            </div>
            <Button variant="outline" className="w-full" disabled>
              Manage Categories
            </Button>
            <p className="text-xs text-muted-foreground mt-2">Add or edit question categories after backend setup.</p>
          </CardContent>
        </Card>

        {/* Predefined Question Sets */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Predefined Question Sets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No question sets configured</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Add predefined question sets for specific roles and topics.
              </p>
            </div>
            <Button variant="outline" className="w-full" disabled>
              Add Question Set
            </Button>
          </CardContent>
        </Card>

        {/* AI Response Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Response Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Brain className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No AI logs available</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Monitor AI-generated questions and response quality here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
