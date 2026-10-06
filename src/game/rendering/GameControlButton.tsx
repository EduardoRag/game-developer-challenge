type GameControlButtonProps = {
	icon: string;
	label: string;
	onPointerDown?: () => void;
	onPointerUp?: () => void;
	onClick?: () => void;
};

export const GameControlButton = ({
	icon,
	label,
	onPointerDown,
	onPointerUp,
	onClick,
}: GameControlButtonProps) => {
	return (
		<button
			type="button"
			className="game-control-button"
			aria-label={label}
			onPointerDown={onPointerDown}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
			onPointerLeave={onPointerUp}
			onClick={onClick}
		>
			<img src={icon} alt="" draggable={false} />
		</button>
	);
};