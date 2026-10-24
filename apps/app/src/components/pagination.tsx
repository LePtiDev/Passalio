import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { fr } from "@/fr";
import type { PagedList } from "@/lib/use-paged-list";

const text = fr.pagination;

type PaginationProps = {
  readonly page: number;
  readonly pageSize: number;
  readonly shown: number;
  readonly total: number | null;
  readonly hasNext: boolean;
  readonly isLoading: boolean;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
};

export const Pagination = ({
  page,
  pageSize,
  shown,
  total,
  hasNext,
  isLoading,
  onPrevious,
  onNext,
}: PaginationProps) => {
  const first = page * pageSize + 1;
  const pages = total === null ? null : Math.max(1, Math.ceil(total / pageSize));
  return (
    <nav
      aria-label={text.label}
      className="flex items-center justify-between gap-3 border-t border-[#E3E8EF] bg-white px-3.5 py-2 text-[13px] text-[#64748B] tabular-nums"
    >
      <span>{shown === 0 ? null : text.range(first, first + shown - 1, total)}</span>
      <span className="flex items-center gap-2">
        {pages === null ? null : (
          <span className="mr-1 hidden lg:inline">{text.page(page + 1, pages)}</span>
        )}
        <Button
          variant="secondary"
          aria-label={text.previous}
          size="icon"
          disabled={page === 0 || isLoading}
          onClick={onPrevious}
        >
          <ChevronLeft aria-hidden="true" className="size-5 lg:size-4" />
        </Button>
        <Button
          variant="secondary"
          aria-label={text.next}
          size="icon"
          disabled={!hasNext || isLoading}
          onClick={onNext}
        >
          <ChevronRight aria-hidden="true" className="size-5 lg:size-4" />
        </Button>
      </span>
    </nav>
  );
};

type CursorPaginationProps = {
  readonly paging: Pick<PagedList, "page" | "pageSize" | "goNext" | "goPrevious">;
  readonly nextCursor: string | null;
  readonly shown: number;
  readonly total: number | null;
  readonly isLoading: boolean;
};

export const CursorPagination = ({
  paging,
  nextCursor,
  shown,
  total,
  isLoading,
}: CursorPaginationProps) => {
  const { goNext } = paging;
  const showNext = useCallback(() => {
    if (nextCursor !== null) {
      goNext(nextCursor);
    }
  }, [goNext, nextCursor]);
  return (
    <Pagination
      page={paging.page}
      pageSize={paging.pageSize ?? shown}
      shown={shown}
      total={total}
      hasNext={nextCursor !== null}
      isLoading={isLoading}
      onPrevious={paging.goPrevious}
      onNext={showNext}
    />
  );
};
