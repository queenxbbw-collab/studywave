import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Pagină Negăsită</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Pagina pe care o cauți nu există sau a fost mutată.
          </p>
          <Link href="/">
            <button className="mt-4 text-sm text-primary hover:underline font-medium">
              Înapoi la pagina principală
            </button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
