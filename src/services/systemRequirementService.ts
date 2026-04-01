type SystemRequirements = {
  Minimum?: string;
  OS?: string;
  Processor?: string;
  Memory?: string;
  Graphics?: string;
  DirectX?: string;
  Network?: string;
  Storage?: string;
  Notes?: string;
};

export function extractRequirements(html: string): SystemRequirements {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const result: SystemRequirements = {};

  // Extract "Minimum" title
  const strongTag = doc.querySelector("strong");
  if (strongTag) {
    result.Minimum = strongTag.textContent?.replace(":", "").trim();
  }

  const items = doc.querySelectorAll("li");

  items.forEach((li) => {
    const strong = li.querySelector("strong");
    if (!strong) return;

    const key = strong.textContent?.replace(":", "").trim();

    // Remove the strong text from li text to get value
    const value = li.textContent
      ?.replace(strong.textContent || "", "")
      .trim();

    if (!key || !value) return;

    switch (key.toLowerCase()) {
      case "os":
        result.OS = value;
        break;
      case "processor":
        result.Processor = value;
        break;
      case "memory":
        result.Memory = value;
        break;
      case "graphics":
        result.Graphics = value;
        break;
      case "storage":
        result.Storage = value;
        break;
      case "additional notes":
        result.Notes = value;
        break;
      case "directx":
        result.DirectX = value;
        break;
      case "network":
        result.Network = value;
        break;
    }
  });

  return result;
}
