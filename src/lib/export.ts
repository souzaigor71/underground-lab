import { jsPDF } from "jspdf";

export type ExportMaterial = {
  title: string | null;
  topic: string;
  level: string;
  intro: string | null;
  objectives: string | null;
};
export type ExportChapter = { title: string; content: string };
export type ExportSource = { title: string; domain: string; url: string; accessed_at: string };

export function buildMarkdown(
  material: ExportMaterial,
  chapters: ExportChapter[],
  sources: ExportSource[],
): string {
  const lines: string[] = [];
  lines.push(`# ${material.title ?? material.topic}`);
  lines.push(`*INSTITUTO UNDERGROUND — Gerador Inteligente de Estudos*`);
  lines.push(`\n**Assunto:** ${material.topic}  \n**Nível:** ${material.level}\n`);
  lines.push("---\n");
  lines.push("## Sumário\n");
  lines.push("1. Introdução");
  lines.push("2. Objetivos de aprendizagem");
  chapters.forEach((c, i) => lines.push(`${i + 3}. ${c.title}`));
  if (sources.length) lines.push(`${chapters.length + 3}. Fontes consultadas`);
  lines.push("\n---\n");
  lines.push("## Introdução\n");
  lines.push(material.intro ?? "");
  lines.push("\n## Objetivos de aprendizagem\n");
  lines.push(material.objectives ?? "");
  chapters.forEach((c) => {
    lines.push("\n");
    lines.push(c.content);
  });
  if (sources.length) {
    lines.push("\n## Fontes consultadas\n");
    sources.forEach((s) => {
      const date = new Date(s.accessed_at).toLocaleDateString("pt-BR");
      lines.push(`- **${s.title}** — ${s.domain} — [${s.url}](${s.url}) — acesso em ${date}`);
    });
  }
  return lines.join("\n");
}

export function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

type Line = { text: string; style: "h1" | "h2" | "h3" | "body" | "code" | "bullet" };

function markdownToLines(md: string): Line[] {
  const out: Line[] = [];
  let inCode = false;
  for (const raw of md.split("\n")) {
    const line = raw.replace(/\r/g, "");
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      out.push({ text: line, style: "code" });
      continue;
    }
    const clean = line
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");
    if (/^#{1}\s/.test(clean)) out.push({ text: clean.replace(/^#\s/, ""), style: "h1" });
    else if (/^#{2}\s/.test(clean)) out.push({ text: clean.replace(/^##\s/, ""), style: "h2" });
    else if (/^#{3,}\s/.test(clean)) out.push({ text: clean.replace(/^#{3,}\s/, ""), style: "h3" });
    else if (/^\s*[-*]\s/.test(clean)) out.push({ text: clean.replace(/^\s*[-*]\s/, "• "), style: "bullet" });
    else out.push({ text: clean, style: "body" });
  }
  return out;
}

export function exportPdf(material: ExportMaterial, chapters: ExportChapter[], sources: ExportSource[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56;
  const title = material.title ?? material.topic;

  // Capa
  doc.setFillColor(10, 16, 13);
  doc.rect(0, 0, W, H, "F");
  doc.setTextColor(120, 240, 160);
  doc.setFont("courier", "bold");
  doc.setFontSize(13);
  doc.text("INSTITUTO UNDERGROUND", M, 120);
  doc.setTextColor(210, 230, 215);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text(doc.splitTextToSize(title, W - M * 2), M, 190);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(160, 190, 170);
  doc.text("Gerador Inteligente de Estudos", M, H - 150);
  doc.text(`Nível: ${material.level}`, M, H - 128);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, M, H - 106);

  // Índice
  doc.addPage();
  let y = M;
  doc.setTextColor(20, 30, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Índice", M, y);
  y += 30;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  ["Introdução", "Objetivos de aprendizagem", ...chapters.map((c) => c.title)]
    .concat(sources.length ? ["Fontes consultadas"] : [])
    .forEach((t, i) => {
      doc.text(`${i + 1}. ${t}`, M, y);
      y += 20;
      if (y > H - M) {
        doc.addPage();
        y = M;
      }
    });

  const sections: { heading: string; body: string }[] = [
    { heading: "Introdução", body: material.intro ?? "" },
    { heading: "Objetivos de aprendizagem", body: material.objectives ?? "" },
    ...chapters.map((c) => ({ heading: c.title, body: c.content })),
  ];
  if (sources.length) {
    sections.push({
      heading: "Fontes consultadas",
      body: sources
        .map(
          (s) =>
            `- ${s.title} — ${s.domain} — ${s.url} — acesso em ${new Date(s.accessed_at).toLocaleDateString("pt-BR")}`,
        )
        .join("\n"),
    });
  }

  for (const section of sections) {
    doc.addPage();
    y = M;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(20, 60, 35);
    doc.text(doc.splitTextToSize(section.heading, W - M * 2), M, y);
    y += 28;

    for (const line of markdownToLines(section.body)) {
      if (line.text.trim() === "") {
        y += 8;
        continue;
      }
      if (line.style === "h1" || line.style === "h2") {
        if (line.text.trim().toLowerCase() === section.heading.trim().toLowerCase()) continue;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.setTextColor(20, 60, 35);
        y += 8;
      } else if (line.style === "h3") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12.5);
        doc.setTextColor(30, 40, 34);
        y += 6;
      } else if (line.style === "code") {
        doc.setFont("courier", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(35, 60, 45);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.8);
        doc.setTextColor(28, 32, 30);
      }
      const wrapped = doc.splitTextToSize(line.text, W - M * 2 - (line.style === "bullet" ? 12 : 0));
      for (const w of wrapped) {
        if (y > H - M - 20) {
          doc.addPage();
          y = M;
        }
        doc.text(w, M + (line.style === "bullet" ? 12 : 0), y);
        y += line.style === "code" ? 12.5 : 15;
      }
    }
  }

  // Numeração de páginas
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 130, 125);
    doc.text(`${title} — página ${i - 1}`, M, H - 24);
    doc.text("INSTITUTO UNDERGROUND", W - M, H - 24, { align: "right" });
  }

  doc.save(`${title.replace(/[^\w\s-]/g, "").slice(0, 60) || "apostila"}.pdf`);
}
