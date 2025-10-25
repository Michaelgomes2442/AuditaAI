import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { LayoutGrid, ListFilter, Users } from "lucide-react";
import * as React from "react";

interface LogFilters {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
}

interface LogFiltersProps {
  users: Array<{ id: string; name: string }>;
  eventTypes: string[];
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
}

export function LogFilters({
  users,
  eventTypes,
  filters,
  onFiltersChange,
}: LogFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ListFilter className="h-5 w-5" />
        <h2 className="font-semibold">Filters</h2>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">User</span>
          </div>
          <Select
            value={filters.userId}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, userId: value })
            }
          >
            <SelectTrigger data-testid="user-filter">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Event Type</span>
          </div>
          <Select
            value={filters.eventType}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, eventType: value })
            }
          >
            <SelectTrigger data-testid="event-type-filter">
              <SelectValue placeholder="Filter by event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Events</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">Date Range</span>
          </div>
          <div className="space-y-2" data-testid="date-range-filter">
            <DatePicker
              date={filters.startDate}
              onChange={(date) => onFiltersChange({ ...filters, startDate: date })}
              placeholder="Start date"
            />
            <DatePicker
              date={filters.endDate}
              onChange={(date) => onFiltersChange({ ...filters, endDate: date })}
              placeholder="End date"
            />
          </div>
        </div>
      </div>
    </div>
  );
}