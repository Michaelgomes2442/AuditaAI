import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

interface Log {
  id: string;
  userId: string;
  eventType: string;
  timestamp: string;
  details: string;
  user: {
    id: string;
    name: string;
  } | null;
}

export function LogEntry({ log }: { log: Log }) {
  const date = new Date(log.timestamp);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="group p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted/50 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {log.user?.name || "Unknown User"}
              </p>
              <p className="text-sm text-muted-foreground">
                {log.eventType}
              </p>
            </div>
            <time
              dateTime={date.toISOString()}
              className="text-sm text-muted-foreground tabular-nums"
            >
              {formatDistanceToNow(date, { addSuffix: true })}
            </time>
          </div>
          {log.details && (
            <>
              <Separator className="my-2" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {log.details}
              </p>
            </>
          )}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{log.eventType}</DialogTitle>
          <DialogDescription>
            {new Date(log.timestamp).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold">User</p>
            <Alert>
              <AlertDescription>
                {log.user?.name || "Unknown User"}
              </AlertDescription>
            </Alert>
          </div>
          {log.details && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Details</p>
              <Alert>
                <AlertDescription className="whitespace-pre-wrap">
                  {log.details}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}