export function DecisionMessage({ message }: { message: string }) {
  const parts = message.split("\n\n").filter(Boolean);

  if (parts.length <= 1) {
    return <p className="font-body text-xs text-slate-700 dark:text-slate-300">{message}</p>;
  }

  return (
    <div className="space-y-2 font-body text-xs text-slate-700 dark:text-slate-300">
      <p className="font-semibold text-navy-800 dark:text-mist-100">{parts[0]}</p>
      {parts.slice(1).map((part, idx) => (
        <p key={idx}>{part}</p>
      ))}
    </div>
  );
}
