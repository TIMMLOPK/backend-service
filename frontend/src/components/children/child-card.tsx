import { Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/types";

interface ChildCardProps {
  child: User;
}

export function ChildCard({ child }: ChildCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <Avatar name={child.full_name} />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate">
            {child.full_name}
          </h4>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
            <Mail className="h-3.5 w-3.5" />
            <span className="truncate">{child.email}</span>
          </div>
          <div className="mt-2">
            <Badge>
              @{child.username}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
