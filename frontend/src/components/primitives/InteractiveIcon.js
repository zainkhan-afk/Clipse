export default function InteractiveIcon({ icon: Icon, onClick, className = "" }) {
  return (
    <Icon
      onClick={onClick}
      className={`
        w-6 h-6 cursor-pointer
        hover:text-blue-400 
        hover:bg-gray-700 
        hover:rounded 
        p-1
        active:scale-90
        transition 
        ${className}
      `}
    />
  );
}
