type MinusButtonProps = {
    onClick: () => void;
    disabled?: boolean;
    ariaLabel: string;
};

export const MinusButton = ({
    onClick,
    disabled = false,
    ariaLabel,
}: MinusButtonProps) => {
    return (
        <button
            type="button"
            className="round-icon-button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
        >
            <img
                src="/assets/png/default/ui/controls/icon_minus.png"
                alt=""
            />
        </button>
    );
};