import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";

interface LogFilters {
  userId?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
}

interface ExportButtonProps {
  filters: LogFilters;
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const queryParams = new URLSearchParams({
        userId: filters.userId || "",
        eventType: filters.eventType || "",
        startDate: filters.startDate?.toISOString() || "",
        endDate: filters.endDate?.toISOString() || "",
      });

      const response = await fetch(`/api/logs/export?${queryParams}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "audit-logs.csv";

      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        "Exporting..."
      ) : (
        <>
          <DownloadIcon className="w-4 h-4 mr-2" />
          Export Logs
        </>
      )}
    </Button>
  );
}