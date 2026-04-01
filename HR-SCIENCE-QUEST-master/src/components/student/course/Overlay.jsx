export default function Overlay({ visible, onClick }) {
  return (
    <div
      aria-hidden={!visible}
      onClick={visible ? onClick : undefined}
      className={`fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[2px] transition-opacity duration-300 ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    />
  );
}
