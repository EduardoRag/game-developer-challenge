type PaginationProps = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

export const Pagination = ({
    page,
    totalPages,
    onPageChange,
}: PaginationProps) => {
    const handlePrevious = () => {
        if (page > 1) {
            onPageChange(page - 1);
        }
    };

    const handleNext = () => {
        if (page < totalPages) {
            onPageChange(page + 1);
        }
    };

    return (
        <nav
            className="pagination"
            aria-label="Pagination"
        >
            <button
                type="button"
                className="pagination__button"
                aria-label="Previous page"
                disabled={page === 1}
                onClick={handlePrevious}
            >
                <img
                    src="/assets/png/default/ui/controls/icon_turn_left.png"
                    alt=""
                />
            </button>

            <span className="pagination__label">
                PAGE {page} OF {totalPages}
            </span>

            <button
                type="button"
                className="pagination__button"
                aria-label="Next page"
                disabled={page >= totalPages}
                onClick={handleNext}
            >
                <img
                    src="/assets/png/default/ui/controls/icon_turn_right.png"
                    alt=""
                />
            </button>
        </nav>
    );
};