// Turns whatever was dropped on the photo zone into an image we can analyze.
//
// - From the computer: a real image file.
// - From another web page / tab (e.g. Google Images): browsers usually send NO file, only
//   the image's HTML (<img src>) and URLs. A `data:` image is converted to a file here;
//   an http(s) image can't be read by our page (CORS), so we keep its URL and let the
//   server pass it to Claude, which downloads it.

export type DroppedImage = { kind: "file"; file: File } | { kind: "url"; url: string };

export type DropData = { files: File[]; html: string; uriList: string; text: string };

/** Whether a drag may carry an image (file or web image). */
export function mayContainImage(dataTransfer: DataTransfer): boolean {
  const { types } = dataTransfer;
  return types.includes("Files") || types.includes("text/uri-list") || types.includes("text/html");
}

/** Call synchronously inside the `drop` handler — the browser empties DataTransfer afterwards. */
export function readDropData(dataTransfer: DataTransfer): DropData {
  return {
    files: [...dataTransfer.files],
    html: dataTransfer.getData("text/html"),
    uriList: dataTransfer.getData("text/uri-list"),
    text: dataTransfer.getData("text/plain"),
  };
}

const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|avif|bmp|heic|heif)$/i;

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || IMAGE_EXTENSION.test(file.name);
}

/** Image URLs in priority order: <img src> from the HTML first (the actual picture), then links. */
function candidateUrls({ html, uriList, text }: DropData): string[] {
  const urls: string[] = [];
  if (html) {
    // DOMParser builds an inert document: nothing is loaded or executed.
    const doc = new DOMParser().parseFromString(html, "text/html");
    for (const img of doc.querySelectorAll("img")) {
      const src = img.getAttribute("src");
      if (src) urls.push(src.trim());
    }
  }
  for (const line of uriList.split(/\r?\n/)) {
    if (line.trim() && !line.startsWith("#")) urls.push(line.trim());
  }
  if (text.trim()) urls.push(text.trim());
  return urls.map((url) => (url.startsWith("//") ? `https:${url}` : url));
}

export async function resolveDroppedImage(data: DropData): Promise<DroppedImage | null> {
  const file = data.files.find(isImageFile);
  if (file) return { kind: "file", file };

  for (const url of candidateUrls(data)) {
    if (url.startsWith("data:image/")) {
      const blob = await (await fetch(url)).blob();
      const extension = blob.type.split("/")[1] ?? "png";
      return { kind: "file", file: new File([blob], `anh-keo-tha.${extension}`, { type: blob.type }) };
    }
    if (/^https?:\/\//i.test(url)) return { kind: "url", url };
  }
  return null;
}
