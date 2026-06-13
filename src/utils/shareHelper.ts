interface ShareData {
  title: string;
  text: string;
  url: string;
}

export async function shareHealthReport(data: ShareData): Promise<void> {
  const shareData = {
    title: data.title,
    text: data.text,
    url: data.url
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Navigator share failed, falling back to clipboard:", err);
      } else {
        // User cancelled the share sheet, do nothing
        return;
      }
    }
  }

  // Fallback: Copy to clipboard
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(`${data.title}\n\n${data.text}\n\nLink: ${data.url}`);
      alert("Report copied to clipboard! You can paste it anywhere to share.");
    } else {
      // Old school fallback
      const textarea = document.createElement("textarea");
      textarea.value = `${data.title}\n\n${data.text}\n\nLink: ${data.url}`;
      textarea.style.position = "fixed"; // prevent scrolling to bottom
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("Report copied to clipboard! You can paste it anywhere to share.");
    }
  } catch (err) {
    console.error("Clipboard fallback failed:", err);
    alert("Unable to share or copy the report. Please copy the text manually.");
  }
}
