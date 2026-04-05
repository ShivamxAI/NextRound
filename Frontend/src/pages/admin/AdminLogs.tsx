import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Search, Download, Filter, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

// Define the shape of our Log data
interface LogEntry {
  id: string;
  timestamp: string;
  type: string;
  user: string;
  action: string;
  details: string;
}

export default function AdminLogs() {
  const [search, setSearch] = useState("");
  const [logType, setLogType] = useState("all");
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch the logs on load
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await fetchWithAuth("/admin/logs");
        setLogs(data.logs || []);
      } catch (err) {
        console.error("Failed to load logs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  // 2. Real-time Filtering Logic
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase());
      
    const matchesType = logType === "all" || log.type === logType;

    return matchesSearch && matchesType;
  });

  // Helper function to color-code the log types
  const getBadgeColor = (type: string) => {
    switch(type) {
      case "auth": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "api": return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case "user": return "bg-green-100 text-green-700 hover:bg-green-100";
      case "system": return "bg-gray-100 text-gray-700 hover:bg-gray-100";
      default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    // 1. Create the CSV headers
    const headers = ["Timestamp", "Type", "User", "Action", "Details"];

    // 2. Map over the logs and format them as CSV rows
    const csvRows = filteredLogs.map(log => {
      // We wrap the text in quotes just in case your details contain commas!
      return `"${log.timestamp}","${log.type}","${log.user}","${log.action}","${log.details.replace(/"/g, '""')}"`;
    });

    // 3. Combine headers and rows with line breaks
    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // 4. Create a temporary "Blob" (file) in the browser
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // 5. Create a fake link, click it to download, and remove it
    const link = document.createElement("a");
    link.href = url;
    // Names the file something like: nextround_logs_2026-03-28.csv
    link.download = `nextround_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Reporting & Logs</h1>
          <p className="text-muted-foreground mt-1">System logs, user activity, and API usage</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}
        disabled={filteredLogs.length === 0 || loading}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by action, detail, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={logType} onValueChange={setLogType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Log Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Logs</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="user">User Activity</SelectItem>
                <SelectItem value="api">API Usage</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow>
                   <TableCell colSpan={5} className="h-32 text-center">
                     <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                   </TableCell>
                 </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground font-medium">No logs found</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Try adjusting your search filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {log.timestamp}
                    </TableCell>
                    <TableCell>
                      <Badge className={`uppercase text-[10px] ${getBadgeColor(log.type)}`} variant="outline">
                        {log.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {log.user}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {log.action}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}