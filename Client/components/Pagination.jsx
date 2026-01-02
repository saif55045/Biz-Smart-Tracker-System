/**
 * Pagination Component
 * 
 * A reusable pagination component for lists.
 * Supports page numbers, prev/next buttons, and page size selection.
 * 
 * USAGE:
 *   <Pagination
 *     currentPage={1}
 *     totalPages={10}
 *     onPageChange={(page) => setPage(page)}
 *     pageSize={20}
 *     onPageSizeChange={(size) => setPageSize(size)}
 *   />
 */

import React from 'react';
import './Pagination.css';

const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalItems = 0,
    pageSize = 20,
    onPageSizeChange,
    showPageSize = true,
    pageSizeOptions = [10, 20, 50, 100]
}) => {
    // Calculate visible page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        // Adjust start if we're near the end
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        // Add first page and ellipsis if needed
        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }

        // Add visible pages
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        // Add last page and ellipsis if needed
        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    const handlePageClick = (page) => {
        if (page !== '...' && page !== currentPage && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const handlePrev = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    if (totalPages <= 1 && !showPageSize) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="pagination-container">
            {/* Items info */}
            {totalItems > 0 && (
                <div className="pagination-info">
                    Showing {startItem}-{endItem} of {totalItems}
                </div>
            )}

            {/* Page controls */}
            <div className="pagination-controls">
                <button
                    className="pagination-btn pagination-prev"
                    onClick={handlePrev}
                    disabled={currentPage <= 1}
                >
                    ← Prev
                </button>

                <div className="pagination-pages">
                    {getPageNumbers().map((page, index) => (
                        <button
                            key={index}
                            className={`pagination-btn pagination-page ${page === currentPage ? 'active' : ''
                                } ${page === '...' ? 'ellipsis' : ''}`}
                            onClick={() => handlePageClick(page)}
                            disabled={page === '...'}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    className="pagination-btn pagination-next"
                    onClick={handleNext}
                    disabled={currentPage >= totalPages}
                >
                    Next →
                </button>
            </div>

            {/* Page size selector */}
            {showPageSize && onPageSizeChange && (
                <div className="pagination-size">
                    <span>Per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
};

export default Pagination;
