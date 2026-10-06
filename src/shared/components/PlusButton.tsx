type PlusButtonProps = {
    onClick: () => void;
    disabled?: boolean;
    ariaLabel: string;
};

export const PlusButton = ({
    onClick,
    disabled = false,
    ariaLabel,
}: PlusButtonProps) => {
    return (
        <button
            type="button"
            className="round-icon-button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
        >
            <img
                src="/assets/png/default/ui/controls/icon_plus.png"
                alt=""
            />
        </button>
    );
};