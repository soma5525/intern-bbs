import Link from "next/link";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
}: PaginationProps) {
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button variant="outline" size="sm" disabled={!hasPrevPage} asChild>
        {hasPrevPage ? (
          <Link href={`/protected/posts?page=${currentPage - 1}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            前へ
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-4 w-4 mr-1" />
            前へ
          </span>
        )}
      </Button>

      <span className="text-sm text-muted-foreground">
        {currentPage} / {totalPages}
      </span>

      <Button variant="outline" size="sm" disabled={!hasNextPage} asChild>
        {hasNextPage ? (
          <Link href={`/protected/posts?page=${currentPage + 1}`}>
            次へ
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        ) : (
          <span>
            次へ
            <ChevronRight className="h-4 w-4 ml-1" />
          </span>
        )}
      </Button>
    </div>
  );
}
