export default function InteractiveIcon({ icon: Icon, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-raised hover:text-ink active:scale-90 ${className}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
