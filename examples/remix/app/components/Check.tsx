export function Check({ checked = false }: { checked?: boolean }) {
   return (
      <div
         className={`aspect-square w-6 leading-none rounded-full p-px transition-colors cursor-pointer ${checked ? "bg-green-500" : "bg-white/20 hover:bg-white/40"}`}
      >
         <input type="checkbox" checked={checked} readOnly />
      </div>
   );
}
