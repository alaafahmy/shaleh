export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 w-full">
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="w-16 h-16 rounded-full border-4 border-[var(--color-bg-input)] border-t-[var(--color-gold-primary)] animate-spin"></div>
        {/* Inner static element */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">
          🏖️
        </div>
      </div>
      <p className="text-[#8b92a5] font-bold animate-pulse text-sm">جاري تحميل البيانات...</p>
    </div>
  );
}
