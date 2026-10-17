/** Crops the middle square of the picture and shrinks it. Nothing is uploaded. */
export async function squarePhoto(file: File, size = 420): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file (JPG or PNG).");
  if (file.size > 15 * 1024 * 1024) throw new Error("That picture is too large. Choose one under 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => fail(new Error("Could not read that picture. Try a JPG or PNG."));
      i.src = url;
    });
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Your browser could not process the picture.");
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
    return c.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}
