/** Soft split light. No stadium, no grid. */

export function ArenaBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-32 top-[-20%] h-[36rem] w-[36rem] rounded-full bg-arena-cyan/[0.12] blur-[120px]" />
      <div className="absolute -right-24 bottom-[-10%] h-[32rem] w-[32rem] rounded-full bg-arena-orange/[0.10] blur-[120px]" />
    </div>
  );
}
