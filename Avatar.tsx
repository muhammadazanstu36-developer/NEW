import { initials } from "@/lib/profile";

/** The profile photo, or the person's initials when there is no photo. */
export function Avatar({ photo, name, size }: { photo: string; name: string; size: number }) {
  const style = { width: size, height: size, fontSize: size * 0.36 };
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt="" width={size} height={size} style={style} className="shrink-0 rounded-full object-cover shadow-glow" />;
  }
  return (
    <span style={style} className="grid shrink-0 place-items-center rounded-full bg-brand font-extrabold text-accent-ink shadow-glow" aria-hidden>
      {initials(name)}
    </span>
  );
}
