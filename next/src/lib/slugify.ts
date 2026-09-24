/** Port of `src/app/pages/shared/utils/slugifying.ts`. */
export function slugify(value: string): string {
  const a =
    "àáäâãåăæąçćčđèéėëêęǵḧìíïîįłḿǹńňñòóöôœøṕŕřßśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;";
  const b = "aaaaaaaaacccdeeeeeeghiiiiilmnnnnooooooprrssssttuuuuuuuuuwxyyzzz------";
  const p = new RegExp(a.split("").join("|"), "g");

  return value
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(p, (c) => b.charAt(a.indexOf(c)))
    .replace(/&/g, "-and-")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
