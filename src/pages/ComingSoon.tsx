import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";

const ComingSoon = () => {
  const location = useLocation();
  const pageName = location.pathname.split("/").pop() || "Page";
  const title = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="shadow-card max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Construction className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground text-sm">
            This module is under development and will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
